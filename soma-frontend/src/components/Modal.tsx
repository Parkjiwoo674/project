import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  type = "info",
  confirmText = "확인",
  cancelText = "취소",
  showCancel = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  const getColor = () => {
    switch (type) {
      case "warning":
        return "#f59e0b";
      case "error":
        return "#ef4444";
      case "success":
        return "#10b981";
      default:
        return "#3b82f6";
    }
  };

  return (
    <div style={S.overlay} onClick={onCancel}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...S.iconBox, background: `${getColor()}15` }}>
          <span style={{ fontSize: 32 }}>{getIcon()}</span>
        </div>

        {title && <h3 style={S.title}>{title}</h3>}
        
        <p style={S.message}>{message}</p>

        <div style={S.buttons}>
          {showCancel && (
            <button style={S.cancelBtn} onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button
            style={{ ...S.confirmBtn, background: getColor() }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "white",
    borderRadius: 16,
    padding: "32px 28px 24px",
    maxWidth: 420,
    width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    animation: "modalSlideIn 0.2s ease-out",
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: "var(--deep)",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "'Noto Serif KR', serif",
  },
  message: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "var(--mid)",
    marginBottom: 24,
    textAlign: "center",
    whiteSpace: "pre-line",
  },
  buttons: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px 24px",
    border: "1px solid var(--sand)",
    background: "white",
    color: "var(--mid)",
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  confirmBtn: {
    flex: 1,
    padding: "12px 24px",
    border: "none",
    color: "white",
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
};
