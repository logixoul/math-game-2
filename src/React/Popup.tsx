import { ReactNode, useEffect, useRef } from "react";

type PopupProps = {
	isOpen: boolean;
	onClose: () => void;
	className?: string;
	children: ReactNode;
};

export function Popup({ isOpen, onClose, className, children }: PopupProps) {
	const popupRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (popupRef.current && target && !popupRef.current.contains(target)) {
				onClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div ref={popupRef} className={className}>
			{children}
		</div>
	);
}
