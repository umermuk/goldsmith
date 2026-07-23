import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const base = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: "rounded-sm font-sans",
    title: "font-display text-ink text-xl",
    htmlContainer: "text-ink-muted text-sm",
    confirmButton:
      "btn-primary mx-1 min-w-[6rem]",
    cancelButton:
      "btn-secondary mx-1 min-w-[6rem]",
    actions: "gap-2",
  },
});

export async function showSuccess(message: string, title = "Success") {
  await base.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonText: "OK",
  });
}

export async function showError(message: string, title = "Error") {
  await base.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonText: "OK",
  });
}

export async function showInfo(message: string, title = "Notice") {
  await base.fire({
    icon: "info",
    title,
    text: message,
    confirmButtonText: "OK",
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
    reverseButtons: true,
    customClass: {
      popup: "rounded-sm font-sans",
      title: "font-display text-ink text-xl",
      htmlContainer: "text-ink-muted text-sm",
      confirmButton: opts?.danger
        ? "inline-flex items-center justify-center gap-2 rounded-sm bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 mx-1 min-w-[6rem]"
        : "btn-primary mx-1 min-w-[6rem]",
      cancelButton: "btn-secondary mx-1 min-w-[6rem]",
      actions: "gap-2",
    },
  });

  return result.isConfirmed;
}
