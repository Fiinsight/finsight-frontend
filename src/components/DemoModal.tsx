import { Modal, type ModalProps } from "react-native";
import { TouchIndicatorOverlay } from "./TouchIndicatorOverlay";

export function DemoModal({ children, ...props }: ModalProps) {
  return <Modal {...props}><TouchIndicatorOverlay>{children}</TouchIndicatorOverlay></Modal>;
}
