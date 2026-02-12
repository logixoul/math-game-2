import { RefObject } from "react";
import type { Message } from "@/logic/Message";
import styles from "./MessageLog.module.css";

type MessageLogProps = {
	messages: Message[];
	activePromptIndex: number | null;
	currentAnswer: string;
	logRef: RefObject<HTMLDivElement>;
};

export function MessageLog({
	messages,
	activePromptIndex,
	currentAnswer,
	logRef,
}: MessageLogProps) {
	return (
		<div className={`${styles.messageLog} canGoBehindTopBar`} ref={logRef}>
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
									? currentAnswer
									: "")}
						</span>
					)}
				</p>
			))}
		</div>
	);
}
