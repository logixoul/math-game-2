import * as React from "react";

type NonScrollingButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onPointerDown" | "onPointerUp"
> & {
  onPress: (e: React.PointerEvent<HTMLButtonElement>) => void;
};

export function NonScrollingButton({
  onPress,
  disabled,
  children,
  style,
  ...rest
}: NonScrollingButtonProps) {
  // Track whether this pointer interaction began on the button.
  const activePointerId = React.useRef<number | null>(null);
  const pressed = React.useRef(false);

  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        touchAction: "none", // since the area isn't scrollable, we can fully opt out of scrolling gestures
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      {...rest}
      onPointerDown={(e) => {
        if (disabled) return;

        // Only primary button for mouse; for touch/pen this is fine.
        if (e.pointerType === "mouse" && e.button !== 0) return;

        pressed.current = true;
        activePointerId.current = e.pointerId;

        // Ensures we receive pointerup even if the finger drifts off the button.
        e.currentTarget.setPointerCapture(e.pointerId);

        // Prevents some browsers from doing text selection / weird default handling.
        e.preventDefault();
      }}
      onPointerUp={(e) => {
        if (disabled) return;

        // Only fire if this interaction started here.
        if (!pressed.current) return;
        if (activePointerId.current !== e.pointerId) return;

        pressed.current = false;
        activePointerId.current = null;

        onPress(e);
      }}
      onPointerCancel={() => {
        // Cancel means the OS/browser aborted the gesture — we don’t fire.
        pressed.current = false;
        activePointerId.current = null;
      }}
    >
      {children}
    </button>
  );
}
