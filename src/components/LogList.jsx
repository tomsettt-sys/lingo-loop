export function LogList({ logs, onEdit }) {
  if (!logs.length) {
    return (
      <div className="empty">
        아직 기록이 없어요.
        <br />
        오늘의 첫 학습을 남겨보세요.
      </div>
    )
  }

  return logs.map((item, index) => (
    <div className="log-row" key={item.id || `${item.date}-${item.topic}-${index}`}>
      <span className="symbol">▤</span>
      <div>
        <strong>{item.topic}</strong>
        <small>{item.date} · {item.type}</small>
      </div>
      <div className="log-side">
        <span>{item.minutes}분</span>
        {onEdit && (
          <button className="edit-btn" type="button" onClick={() => onEdit(item)}>수정</button>
        )}
      </div>
    </div>
  ))
}
