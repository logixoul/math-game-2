import { RefObject, useMemo, useState } from "react";
import * as util from "../util";
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
									? currentAnswer
									: "")}
						</span>
					)}
				</p>
			))}
		</div>
	);
}
