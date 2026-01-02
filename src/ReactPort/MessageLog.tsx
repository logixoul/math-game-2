import { RefObject } from "react";
import styles from "./GameSessionPage.module.css";

export type Message = {
	text: string;
	color: string;
	isBold?: boolean;
	isPrompt?: boolean;
	answer?: string;
};

type MessageLogProps = {
	messages: Message[];
	activePromptIndex: number | null;
	isMobile: boolean;
	currentAnswer: string;
	desktopInput: string;
	sessionComplete: boolean;
	logRef: RefObject<HTMLDivElement>;
	desktopInputRef: RefObject<HTMLInputElement>;
	onDesktopInputChange: (value: string) => void;
	onDesktopSubmit: () => void;
};

export function MessageLog({
	messages,
	activePromptIndex,
	isMobile,
	currentAnswer,
	desktopInput,
	sessionComplete,
	logRef,
	desktopInputRef,
	onDesktopInputChange,
	onDesktopSubmit,
}: MessageLogProps) {
	return (
		<div className={styles.messageLog} ref={logRef}>
			{messages.map((message, index) => (
				<p
					key={`${index}-${message.text}`}
					style={{
						color: message.color,
						fontWeight: message.isBold ? "bold" : "normal",
					}}
				>
					{message.text}
					{message.isPrompt && (
						<span className={styles.answerInline}>
							{message.answer ??
								(index === activePromptIndex
									? isMobile
										? currentAnswer
										: null
									: "")}
							{index === activePromptIndex &&
								!isMobile &&
								!message.answer && (
									<input
										ref={desktopInputRef}
										type="text"
										value={desktopInput}
										disabled={sessionComplete}
										onChange={(event) =>
											onDesktopInputChange(event.target.value)
										}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												onDesktopSubmit();
											}
										}}
										placeholder="Твоят отговор"
										className={styles.inlineAnswerInput}
									/>
								)}
						</span>
					)}
				</p>
			))}
		</div>
	);
}
