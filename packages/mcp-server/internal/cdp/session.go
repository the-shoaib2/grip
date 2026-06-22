package cdp

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/chromedp/cdproto/accessibility"
	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/cdproto/dom"
	"github.com/chromedp/cdproto/input"
	"github.com/chromedp/cdproto/log"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/cdproto/runtime"
	"github.com/chromedp/chromedp"
)

type RefEntry struct {
	Ref            string `json:"ref"`
	BackendNodeID  int64  `json:"backendNodeId"`
	Role           string `json:"role,omitempty"`
	Name           string `json:"name,omitempty"`
	FrameID        string `json:"frameId,omitempty"`
	InShadowDom    bool   `json:"inShadowDom,omitempty"`
}

type LogEntry struct {
	Level      string `json:"level"`
	Message    string `json:"message"`
	StackTrace string `json:"stackTrace,omitempty"`
	Timestamp  int64  `json:"timestamp"`
}

type HarEntry struct {
	RequestID        string            `json:"requestId"`
	URL              string            `json:"url"`
	Method           string            `json:"method"`
	Status           int64             `json:"status,omitempty"`
	StatusText       string            `json:"statusText,omitempty"`
	MimeType         string            `json:"mimeType,omitempty"`
	StartedDateTime  string            `json:"startedDateTime"`
	RequestHeaders   map[string]string `json:"requestHeaders,omitempty"`
	ResponseHeaders  map[string]string `json:"responseHeaders,omitempty"`
}

type Session struct {
	ctx        context.Context
	cancel     context.CancelFunc
	allocCtx   context.Context
	allocCancel context.CancelFunc
	port       int
	mu         sync.RWMutex
	refs       map[string]RefEntry
	refCounter int
	refsValid  bool
	logs       []LogEntry
	network    []HarEntry
	lastSnap   time.Time
}

func NewSession(port int) *Session {
	return &Session{
		port:      port,
		refs:      make(map[string]RefEntry),
		refsValid: true,
	}
}

func (s *Session) Connect(ctx context.Context) error {
	targetURL := fmt.Sprintf("http://127.0.0.1:%d/json/version", s.port)
	resp, err := http.Get(targetURL)
	if err != nil {
		return fmt.Errorf("cannot connect to Chrome on port %d: %w (launch with --remote-debugging-port=%d)", s.port, err, s.port)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var info map[string]string
	if err := json.Unmarshal(body, &info); err != nil {
		return err
	}
	wsURL := info["webSocketDebuggerUrl"]
	if wsURL == "" {
		return fmt.Errorf("no webSocketDebuggerUrl from Chrome on port %d", s.port)
	}

	s.allocCtx, s.allocCancel = chromedp.NewRemoteAllocator(ctx, wsURL)
	s.ctx, s.cancel = chromedp.NewContext(s.allocCtx)

	return chromedp.Run(s.ctx,
		network.Enable(),
		log.Enable(),
		runtime.Enable(),
		page.Enable(),
		dom.Enable(),
	)
}

func (s *Session) Close() {
	if s.cancel != nil {
		s.cancel()
	}
	if s.allocCancel != nil {
		s.allocCancel()
	}
}

func (s *Session) InvalidateRefs() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.refsValid = false
	s.refs = make(map[string]RefEntry)
	s.refCounter = 0
}

func (s *Session) assignRef(backendNodeID int64, role, name, frameID string) string {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.refCounter++
	ref := fmt.Sprintf("e%d", s.refCounter)
	s.refs[ref] = RefEntry{
		Ref:           ref,
		BackendNodeID: backendNodeID,
		Role:          role,
		Name:          name,
		FrameID:       frameID,
	}
	return ref
}

func (s *Session) RequireRef(ref string) (RefEntry, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if !s.refsValid {
		return RefEntry{}, fmt.Errorf("refs expired — call snapshot() first")
	}
	entry, ok := s.refs[ref]
	if !ok {
		return RefEntry{}, fmt.Errorf("ref %q not found — call snapshot() first", ref)
	}
	return entry, nil
}

func (s *Session) AllRefs() map[string]RefEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make(map[string]RefEntry, len(s.refs))
	for k, v := range s.refs {
		out[k] = v
	}
	return out
}

func (s *Session) CheckDebounce() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if time.Since(s.lastSnap) < 500*time.Millisecond {
		return fmt.Errorf("snapshot rate limited — wait 500ms")
	}
	s.lastSnap = time.Now()
	return nil
}

func (s *Session) Snapshot(frameID string) (yaml string, title string, url string, err error) {
	if err := s.CheckDebounce(); err != nil {
		return "", "", "", err
	}

	s.mu.Lock()
	s.refs = make(map[string]RefEntry)
	s.refCounter = 0
	s.refsValid = true
	s.mu.Unlock()

	var nodes []*accessibility.AXNode
	var lines []string

	err = chromedp.Run(s.ctx,
		chromedp.Title(&title),
		chromedp.Location(&url),
		chromedp.ActionFunc(func(ctx context.Context) error {
			n, err := accessibility.GetFullAXTree().Do(ctx)
			if err != nil {
				return err
			}
			nodes = n
			return nil
		}),
	)
	if err != nil {
		return "", "", "", err
	}

	byID := make(map[accessibility.AXNodeID]*accessibility.AXNode)
	childSet := make(map[accessibility.AXNodeID]bool)
	for _, n := range nodes {
		byID[n.NodeID] = n
		for _, c := range n.ChildIDs {
			childSet[c] = true
		}
	}

	var roots []*accessibility.AXNode
	for _, n := range nodes {
		if !childSet[n.NodeID] {
			roots = append(roots, n)
		}
	}

	var walk func(*accessibility.AXNode, int)
	walk = func(node *accessibility.AXNode, depth int) {
		if node == nil || node.Ignored {
			if node != nil {
				for _, c := range node.ChildIDs {
					walk(byID[c], depth)
				}
			}
			return
		}
		role := "generic"
		if node.Role != nil {
			role = string(*node.Role)
		}
		name := ""
		if node.Name != nil {
			name = node.Name.Value
		}
		ref := ""
		if node.BackendDOMNodeID != 0 {
			ref = " ref=" + s.assignRef(node.BackendDOMNodeID, role, name, frameID)
		}
		indent := ""
		for i := 0; i < depth; i++ {
			indent += "  "
		}
		label := ""
		if name != "" {
			label = ` "` + name + `"`
		}
		lines = append(lines, fmt.Sprintf("%s- %s%s%s", indent, role, label, ref))
		for _, c := range node.ChildIDs {
			walk(byID[c], depth+1)
		}
	}

	for _, r := range roots {
		walk(r, 0)
	}

	for i, l := range lines {
		if i > 0 {
			yaml += "\n"
		}
		yaml += l
	}
	return yaml, title, url, nil
}

func (s *Session) Highlight(ref string) error {
	entry, err := s.RequireRef(ref)
	if err != nil {
		return err
	}
	var box dom.BoxModel
	err = chromedp.Run(s.ctx,
		chromedp.ActionFunc(func(ctx context.Context) error {
			b, err := dom.GetBoxModel().WithBackendNodeID(entry.BackendNodeID).Do(ctx)
			if err != nil {
				return err
			}
			box = *b
			return nil
		}),
	)
	if err != nil {
		return err
	}
	content := box.Content
	xs := []float64{content[0], content[2], content[4], content[6]}
	ys := []float64{content[1], content[3], content[5], content[7]}
	left, top, right, bottom := xs[0], ys[0], xs[0], ys[0]
	for _, x := range xs {
		if x < left {
			left = x
		}
		if x > right {
			right = x
		}
	}
	for _, y := range ys {
		if y < top {
			top = y
		}
		if y > bottom {
			bottom = y
		}
	}
	script := fmt.Sprintf(`(function(){
		const id='__grip_highlight__';
		document.getElementById(id)?.remove();
		const el=document.createElement('div');
		el.id=id;
		el.style.cssText='position:fixed;pointer-events:none;z-index:2147483647;border:3px solid #2563eb;background:rgba(37,99,235,0.15);';
		el.style.top='%fpx';el.style.left='%fpx';el.style.width='%fpx';el.style.height='%fpx';
		document.documentElement.appendChild(el);
	})()`, top, left, right-left, bottom-top)
	return chromedp.Run(s.ctx, chromedp.Evaluate(script, nil))
}

func (s *Session) Click(ref string) error {
	entry, err := s.RequireRef(ref)
	if err != nil {
		return err
	}
	var box dom.BoxModel
	err = chromedp.Run(s.ctx,
		chromedp.ActionFunc(func(ctx context.Context) error {
			b, err := dom.GetBoxModel().WithBackendNodeID(entry.BackendNodeID).Do(ctx)
			if err != nil {
				return err
			}
			box = *b
			return nil
		}),
	)
	if err != nil {
		return err
	}
	content := box.Content
	x := (content[0] + content[4]) / 2
	y := (content[1] + content[5]) / 2
	return chromedp.Run(s.ctx,
		input.DispatchMouseEvent(input.MousePressed, x, y).WithButton(input.Left).WithClickCount(1),
		input.DispatchMouseEvent(input.MouseReleased, x, y).WithButton(input.Left).WithClickCount(1),
	)
}

func (s *Session) Fill(ref, value string) error {
	entry, err := s.RequireRef(ref)
	if err != nil {
		return err
	}
	return chromedp.Run(s.ctx,
		chromedp.ActionFunc(func(ctx context.Context) error {
			return dom.Focus().WithBackendNodeID(entry.BackendNodeID).Do(ctx)
		}),
		chromedp.ActionFunc(func(ctx context.Context) error {
			return input.InsertText(value).Do(ctx)
		}),
	)
}

func (s *Session) Screenshot(selector string) ([]byte, error) {
	var buf []byte
	if selector != "" {
		entry, err := s.RequireRef(selector)
		if err == nil {
			var box dom.BoxModel
			err = chromedp.Run(s.ctx,
				chromedp.ActionFunc(func(ctx context.Context) error {
					b, e := dom.GetBoxModel().WithBackendNodeID(entry.BackendNodeID).Do(ctx)
					if e != nil {
						return e
					}
					box = *b
					return nil
				}),
			)
			if err == nil {
				content := box.Content
				x := content[0]
				y := content[1]
				w := content[4] - content[0]
				h := content[5] - content[1]
				err = chromedp.Run(s.ctx,
					chromedp.ActionFunc(func(ctx context.Context) error {
						data, e := page.CaptureScreenshot().WithClip(&page.Viewport{
							X: x, Y: y, Width: w, Height: h, Scale: 1,
						}).Do(ctx)
						if e != nil {
							return e
						}
						buf = data
						return nil
					}),
				)
				return buf, err
			}
		}
	}
	err := chromedp.Run(s.ctx, chromedp.FullScreenshot(&buf, 90))
	return buf, err
}

func (s *Session) Navigate(url string) error {
	s.InvalidateRefs()
	return chromedp.Run(s.ctx, chromedp.Navigate(url))
}

func (s *Session) Eval(js string) (string, error) {
	var result string
	err := chromedp.Run(s.ctx, chromedp.Evaluate(js, &result))
	return result, err
}

func (s *Session) ReadLogs(level string) []LogEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if level == "" || level == "all" {
		out := make([]LogEntry, len(s.logs))
		copy(out, s.logs)
		return out
	}
	var out []LogEntry
	for _, e := range s.logs {
		if level == "log" && (e.Level == "log" || e.Level == "info" || e.Level == "debug") {
			out = append(out, e)
		} else if e.Level == level {
			out = append(out, e)
		}
	}
	return out
}

func (s *Session) ReadNetwork(urlFilter, method string, status int64) []HarEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []HarEntry
	for _, e := range s.network {
		if urlFilter != "" && !contains(e.URL, urlFilter) {
			continue
		}
		if method != "" && e.Method != method {
			continue
		}
		if status != 0 && e.Status != status {
			continue
		}
		out = append(out, e)
	}
	return out
}

func contains(s, sub string) bool {
	return len(sub) == 0 || (len(s) >= len(sub) && (s == sub || len(s) > 0 && stringContains(s, sub)))
}

func stringContains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func (s *Session) AddLog(level, message, stack string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.logs = append(s.logs, LogEntry{
		Level: level, Message: message, StackTrace: stack, Timestamp: time.Now().UnixMilli(),
	})
	if len(s.logs) > 500 {
		s.logs = s.logs[len(s.logs)-500:]
	}
}

func (s *Session) AddNetwork(entry HarEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.network = append(s.network, entry)
	if len(s.network) > 200 {
		s.network = s.network[len(s.network)-200:]
	}
}

// PickElement runs in-page picker script and returns element info.
func (s *Session) PickElement(ctx context.Context) (map[string]interface{}, error) {
	pickerJS := `(function(){
		return new Promise((resolve, reject) => {
			const HOVER_ID='__grip_picker_hover__';
			let done=false;
			function cleanup(){
				document.getElementById(HOVER_ID)?.remove();
				document.removeEventListener('mousemove',onMove,true);
				document.removeEventListener('click',onClick,true);
			}
			function onMove(e){
				const el=document.elementFromPoint(e.clientX,e.clientY);
				if(!el)return;
				let h=document.getElementById(HOVER_ID);
				if(!h){h=document.createElement('div');h.id=HOVER_ID;h.style.cssText='position:fixed;pointer-events:none;z-index:2147483646;border:2px dashed #2563eb;';document.documentElement.appendChild(h);}
				const r=el.getBoundingClientRect();
				h.style.top=r.top+'px';h.style.left=r.left+'px';h.style.width=r.width+'px';h.style.height=r.height+'px';
			}
			function onClick(e){
				if(done)return;e.preventDefault();e.stopPropagation();done=true;
				const el=document.elementFromPoint(e.clientX,e.clientY);cleanup();
				if(!el){reject('no element');return;}
				const r=el.getBoundingClientRect();
				resolve({tagName:el.tagName,innerText:(el.innerText||'').slice(0,80),rect:{top:r.top,left:r.left,width:r.width,height:r.height}});
			}
			document.addEventListener('mousemove',onMove,true);
			document.addEventListener('click',onClick,true);
		});
	})()`

	var picked map[string]interface{}
	err := chromedp.Run(s.ctx, chromedp.Evaluate(pickerJS, &picked))
	return picked, err
}

var _ = cdp.Node{}
