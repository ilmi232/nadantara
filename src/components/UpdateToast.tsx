// Pemberitahuan versi baru; guru yang memutuskan kapan memuat ulang.
export function UpdateToast({ onRefresh, onDismiss }: { onRefresh: () => void; onDismiss: () => void }) {
  return (
    <div className="toast" role="status">
      <span>Versi baru Nadantara tersedia.</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={onRefresh}>Muat ulang</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss}>Nanti</button>
    </div>
  );
}
