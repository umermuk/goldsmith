import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const base = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  focusConfirm: true,
  customClass: {
    popup: "rounded-sm font-sans !p-6",
    title: "font-display text-ink !text-xl",
    htmlContainer: "text-ink-muted !text-sm",
    actions: "!mt-5 !gap-2 flex-wrap justify-center",
    confirmButton: "swal2-confirm-btn",
    cancelButton: "swal2-cancel-btn",
  },
});

export async function showSuccess(message: string, title = "Success") {
  await base.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonText: "OK",
    showCancelButton: false,
  });
}

export async function showError(message: string, title = "Error") {
  await base.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonText: "OK",
    showCancelButton: false,
  });
}

export async function showInfo(message: string, title = "Notice") {
  await base.fire({
    icon: "info",
    title,
    text: message,
    confirmButtonText: "OK",
    showCancelButton: false,
  });
}

export async function showConfirm(
  message: string,
  opts?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }
): Promise<boolean> {
  const result = await base.fire({
    icon: "warning",
    title: opts?.title ?? "Are you sure?",
    text: message,
    showCancelButton: true,
    confirmButtonText: opts?.confirmText ?? "Yes",
    cancelButtonText: opts?.cancelText ?? "Cancel",
    customClass: {
      popup: "rounded-sm font-sans !p-6",
      title: "font-display text-ink !text-xl",
      htmlContainer: "text-ink-muted !text-sm",
      actions: "!mt-5 !gap-2 flex-wrap justify-center",
      confirmButton: opts?.danger
        ? "swal2-confirm-btn-danger"
        : "swal2-confirm-btn",
      cancelButton: "swal2-cancel-btn",
    },
  });

  return result.isConfirmed;
}
