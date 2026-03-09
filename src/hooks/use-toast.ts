
import { toast as sonnerToast } from "sonner";

export type ToastProps = {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
};

export const toast = ({ title, description, variant }: ToastProps) => {
    if (variant === "destructive") {
        sonnerToast.error(title, { description });
    } else {
        sonnerToast.success(title, { description });
    }
};

export function useToast() {
    return {
        toast,
    };
}
