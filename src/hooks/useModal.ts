import { useState } from "react";

interface ModalOptions {
  title?: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
  confirmText?: string;
  cancelText?: string;
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions>({ message: "" });
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);
  const [showCancel, setShowCancel] = useState(false);

  const alert = (message: string, type: ModalOptions["type"] = "info", title?: string) => {
    setOptions({ message, type, title, confirmText: "확인" });
    setShowCancel(false);
    setIsOpen(true);
    return new Promise<void>((resolve) => {
      setResolveCallback(() => () => {
        resolve();
        setIsOpen(false);
      });
    });
  };

  const confirm = (
    message: string,
    type: ModalOptions["type"] = "warning",
    title?: string
  ) => {
    setOptions({ message, type, title, confirmText: "확인", cancelText: "취소" });
    setShowCancel(true);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveCallback(() => (value: boolean) => {
        resolve(value);
        setIsOpen(false);
      });
    });
  };

  const handleConfirm = () => {
    if (resolveCallback) {
      resolveCallback(true);
    }
  };

  const handleCancel = () => {
    if (resolveCallback) {
      resolveCallback(false);
    }
  };

  return {
    isOpen,
    options,
    showCancel,
    alert,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
