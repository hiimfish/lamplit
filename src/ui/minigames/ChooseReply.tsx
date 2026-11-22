import { useState } from 'preact/hooks';
import { ROLE_LABEL } from '../../content/roles';
import type { ChooseReplyQuestion } from '../../learning/questions';
import { En } from '../En';
import { Feedback, FeedbackSlot, ReplayBar, hintFor, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

export function ChooseReply({ question, onAnswered }: MinigameProps<ChooseReplyQuestion>) {
  const clock = useAnswerClock();
  const [picked, setPicked] = useState<string | null>(null);
  const correct = question.options.find((o) => o.id === question.correctId);
  const correctText = correct?.text ?? '';
  const pickedOption = question.options.find((o) => o.id === picked);

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const isRight = id === question.correctId;
    const error = question.options.find((o) => o.id === id)?.error ?? 'other';
    const result = clock.finish(question.itemId, isRight, isRight ? undefined : error);
    if (result) onAnswered(result);
    // The reply's clip is the chunk clip: swap `.line.<id>` in the NPC audio id for `.chunk.<id>`.
    play(question.npcAudioId.replace(/\.line\..*$/, `.chunk.${question.correctId}`), correctText);
  };

  return (
    <div class="mg">
      <p class="mg-prompt">{ROLE_LABEL[question.npcRole]}說了這句，你要怎麼回？</p>
      <div class="mg-npc-row">
        <div class="mg-npc">
          <span class="mg-npc-text" data-testid="npc-text" lang="en">
            {question.npcText}
          </span>
        </div>
        <ReplayBar
          audioId={question.npcAudioId}
          text={question.npcText}
          onHelp={clock.markHelp}
          autoplay
        />
      </div>
      <div class="mg-options">
        {question.options.map((option) => {
          const state =
            picked === null
              ? ''
              : option.id === question.correctId
                ? 'right'
                : option.id === picked
                  ? 'wrong'
                  : '';
          return (
            <button
              type="button"
              key={option.id}
              class={`pixel-button mg-option ${state}`}
              data-testid={`option-${option.id}`}
              disabled={picked !== null}
              onClick={() => choose(option.id)}
            >
              <En>{option.text}</En>
            </button>
          );
        })}
      </div>
      <FeedbackSlot>
        {picked !== null && (
          <Feedback
            correct={picked === question.correctId}
            hint={picked === question.correctId ? undefined : hintFor(pickedOption?.error)}
            answer={correctText}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
