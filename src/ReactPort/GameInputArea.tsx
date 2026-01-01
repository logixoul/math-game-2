type GameInputAreaProps = {
	isMobile: boolean;
	sessionComplete: boolean;
	desktopInput: string;
	setDesktopInput: (value: string) => void;
	onDesktopSubmit: () => void;
	onKeypadAppend: (value: string) => void;
	onKeypadBackspace: () => void;
	onKeypadOk: () => void;
	onReveal: () => void;
};

export function GameInputArea({
	isMobile,
	sessionComplete,
	desktopInput,
	setDesktopInput,
	onDesktopSubmit,
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
			) : (
				<div className="desktop-input">
					<input
						type="text"
						value={desktopInput}
						disabled={sessionComplete}
						onChange={(event) => setDesktopInput(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								onDesktopSubmit();
							}
						}}
						placeholder="Type answer and press Enter"
					/>
					<button
						type="button"
						className="start-button"
						disabled={sessionComplete}
						onClick={onDesktopSubmit}
					>
						Submit
					</button>
				</div>
			)}
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
