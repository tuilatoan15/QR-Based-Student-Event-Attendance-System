const fs = require('fs');
const pathPath = 'c:\\Users\\ASUS\\Desktop\\QR-Based-Student-Event-Attendance-System\\web-admin\\src\\pages\\EventsPage.tsx';
let txt = fs.readFileSync(pathPath, 'utf8');

// 1. Thêm Debounce
if (!txt.includes('debouncedSearch')) {
  txt = txt.replace(
    /const \[search, setSearch\] = useState\(''\);/,
    "const [search, setSearch] = useState('');\n  const [debouncedSearch, setDebouncedSearch] = useState('');\n  useEffect(() => {\n    const t = setTimeout(() => setDebouncedSearch(search), 300);\n    return () => clearTimeout(t);\n  }, [search]);"
  );
  txt = txt.replace(/limit, search \}/g, 'limit, search: debouncedSearch }');
  txt = txt.replace(/limit, search\}\)/g, 'limit, search: debouncedSearch })');
  txt = txt.replace(/\[page, search\]/g, '[page, debouncedSearch]');
}

// 2. Chống flicker bằng Regex 
const renderReplacement = `{loading && events.length === 0 && (
          <div className="ep-loading">
            <div className="ep-spin" />
            Đang tải danh sách...
          </div>
        )}
        {error && <div className="ep-error">⚠️ {error}</div>}
        {!error && (
          <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
            {events.length === 0 && !loading && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>Không tìm thấy sự kiện nào.</div>
            )}
            {events.length > 0 && (
              <EventTable events={events} onDelete={handleDelete} />
            )}
            {totalPages > 1 && events.length > 0 && (
              <div className="ep-pagination">
                <button className="ep-page-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
                <div className="ep-page-info">Trang {page} / {totalPages}</div>
                <button className="ep-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
              </div>
            )}
          </div>
        )}`;

txt = txt.replace(/\{loading && \([\s\S]*?\{error && <div className="ep-error">⚠️ \{error\}<\/div>\}\r?\n\s*\{!loading && !error && \([\s\S]*?<\/>\r?\n\s*\)\}/, renderReplacement);

fs.writeFileSync(pathPath, txt);
console.log('Done script');
