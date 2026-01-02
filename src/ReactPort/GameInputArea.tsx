import styles from "./GameInputArea.module.css";

type GameInputAreaProps = {
	isMobile: boolean;
	sessionComplete: boolean;
	onKeypadAppend: (value: string) => void;
	onKeypadBackspace: () => void;
	onKeypadOk: () => void;
	onReveal: () => void;
};

export function GameInputArea({
	isMobile,
	sessionComplete,
	onKeypadAppend,
	onKeypadBackspace,
	onKeypadOk,
	onReveal,
}: GameInputAreaProps) {
	const keypadLayout = [
		{ type: "append", label: "1" },
		{ type: "append", label: "2" },
		{ type: "append", label: "3" },
		{ type: "empty" },
		{ type: "append", label: "4" },
		{ type: "append", label: "5" },
		{ type: "append", label: "6" },
		{ type: "reveal", label: "Не знам" },
		{ type: "append", label: "7" },
		{ type: "append", label: "8" },
		{ type: "append", label: "9" },
		{ type: "backspace" },
		{ type: "append", label: "-" },
		{ type: "append", label: "0" },
		{ type: "empty" },
		{ type: "ok", label: "OK" },
	] as const;

	return (
		<div className={styles.inputArea}>
			{isMobile ? (
				<div className={styles.keypad}>
					{keypadLayout.map((item, index) => {
						if (item.type === "empty") {
							return (
								<div
									key={`empty-${index}`}
									className={styles.keypadSpacer}
									aria-hidden="true"
								/>
							);
						}
						if (item.type === "append") {
							return (
								<button
									key={item.label}
									type="button"
									className={styles.keypadButton}
									disabled={sessionComplete}
									onClick={() => onKeypadAppend(item.label)}
								>
									{item.label}
								</button>
							);
						}
						if (item.type === "reveal") {
							return (
								<button
									key="reveal"
									type="button"
									className={`${styles.keypadButton} ${styles.keypadButtonSecondary}`}
									disabled={sessionComplete}
									onClick={onReveal}
								>
									{item.label}
								</button>
							);
						}
						if (item.type === "backspace") {
							return (
								<button
									key="backspace"
									type="button"
									className={`${styles.keypadButton} ${styles.keypadButtonSecondary}`}
									disabled={sessionComplete}
									onClick={onKeypadBackspace}
								>
									<img src="/assets/backspace.svg" alt="Backspace" />
								</button>
							);
						}
						return (
							<button
								key="ok"
								type="button"
								className={`${styles.keypadButton} ${styles.keypadButtonOk}`}
								disabled={sessionComplete}
								onClick={onKeypadOk}
							>
								{item.label}
							</button>
						);
					})}
				</div>
			) : null}
			{!isMobile && (
				<button
					type="button"
					className={styles.revealButton}
					disabled={sessionComplete}
					onClick={onReveal}
				>
					?? ????
				</button>
			)}
		</div>
	);
}
