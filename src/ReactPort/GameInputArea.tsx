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
	return (
		<div className={styles.inputArea}>
			{isMobile ? (
				<div className={styles.keypad}>
					{["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0"].map(
						(label) => (
							<button
								key={label}
								type="button"
								className={styles.keypadButton}
								disabled={sessionComplete}
								onClick={() => onKeypadAppend(label)}
							>
								{label}
							</button>
						)
					)}
					<button
						type="button"
						className={`${styles.keypadButton} ${styles.keypadButtonSecondary}`}
						disabled={sessionComplete}
						onClick={onKeypadBackspace}
					>
						Back
					</button>
					<button
						type="button"
						className={`${styles.keypadButton} ${styles.keypadButtonOk}`}
						disabled={sessionComplete}
						onClick={onKeypadOk}
					>
						OK
					</button>
				</div>
			) : null}
			<button
				type="button"
				className={styles.revealButton}
				disabled={sessionComplete}
				onClick={onReveal}
			>
				I don't know
			</button>
		</div>
	);
}
