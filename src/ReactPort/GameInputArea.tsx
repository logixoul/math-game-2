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
		<div className="input-area">
			{isMobile ? (
				<div className="keypad">
					{["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0"].map(
						(label) => (
							<button
								key={label}
								type="button"
								className="keypad-button"
								disabled={sessionComplete}
								onClick={() => onKeypadAppend(label)}
							>
								{label}
							</button>
						)
					)}
					<button
						type="button"
						className="keypad-button keypad-button-secondary"
						disabled={sessionComplete}
						onClick={onKeypadBackspace}
					>
						Back
					</button>
					<button
						type="button"
						className="keypad-button keypad-button-ok"
						disabled={sessionComplete}
						onClick={onKeypadOk}
					>
						OK
					</button>
				</div>
			) : null}
			<button
				type="button"
				className="reveal-button"
				disabled={sessionComplete}
				onClick={onReveal}
			>
				I don't know
			</button>
		</div>
	);
}
