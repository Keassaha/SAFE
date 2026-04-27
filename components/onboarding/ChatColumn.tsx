'use client';

import { useState } from 'react';
import type { Question } from '@/lib/audit-types';

interface ChatColumnProps {
  messages: Array<{ id: string; type: 'bubble' | 'user_answer'; content: string }>;
  currentQuestion: Question;
  onAnswer: (value: string | string[]) => void;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
}

export function ChatColumn({
  messages,
  currentQuestion,
  onAnswer,
  onBack,
  onNext,
  canGoBack,
}: ChatColumnProps) {
  return (
    <div className="px-7 py-6 flex flex-col overflow-hidden">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto pr-2">
        {messages.map((msg) =>
          msg.type === 'bubble' ? (
            <ChatBubble key={msg.id} content={msg.content} />
          ) : (
            <UserAnswer key={msg.id} content={msg.content} />
          )
        )}

        <ChatBubble content={currentQuestion.bubble} />

        <div className="ml-[38px] mb-5">
          <QuestionInput question={currentQuestion} onAnswer={onAnswer} />
        </div>
      </div>

      <NavigationFooter canGoBack={canGoBack} onBack={onBack} onNext={onNext} />
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-200/60">
      <div className="w-9 h-9 rounded-full bg-forest-700 flex items-center justify-center text-forest-50 text-[13px] font-medium">
        JT
      </div>
      <div>
        <p className="text-[13px] font-medium text-forest-900">Jérémie Tiahou</p>
        <p className="text-[11px] text-forest-700 mt-0.5 flex items-center gap-1.5">
          <span className="w-[5px] h-[5px] rounded-full bg-forest-700" />
          En ligne · fondateur SAFE
        </p>
      </div>
    </div>
  );
}

function ChatBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5 mb-3.5">
      <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center text-forest-50 text-[11px] font-medium flex-shrink-0">
        JT
      </div>
      <div className="max-w-[420px]">
        <div className="bg-forest-900 text-forest-50 px-4 py-3 rounded-xl rounded-tl text-sm leading-[1.55]">
          {content}
        </div>
      </div>
    </div>
  );
}

function UserAnswer({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-3.5">
      <div className="max-w-[420px] bg-white border border-slate-200 px-4 py-2.5 rounded-xl rounded-tr text-sm text-forest-900">
        {content}
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (value: string | string[]) => void;
}) {
  if (question.type === 'multi_select') {
    return <ChipsInput question={question} onAnswer={onAnswer} />;
  }
  if (question.type === 'card_select') {
    return <CardSelectInput question={question} onAnswer={onAnswer} />;
  }
  return <TextInput question={question} onAnswer={onAnswer} />;
}

function TextInput({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: 'text' | 'email' | 'tel' }>;
  onAnswer: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <input
        type={question.type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={question.placeholder}
        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-forest-900 placeholder:text-slate-500 focus:border-forest-700 focus:outline-none focus:ring-[3px] focus:ring-forest-700/15 transition"
      />
      {question.hint && (
        <p className="text-[11px] text-slate-500">{question.hint}</p>
      )}
      <button
        onClick={() => onAnswer(value)}
        disabled={!value.trim()}
        className="self-start px-4 py-2 bg-forest-900 text-forest-50 text-[13px] font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forest-700 transition"
      >
        Valider
      </button>
    </div>
  );
}

function ChipsInput({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: 'multi_select' }>;
  onAnswer: (value: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition ${
                isSelected
                  ? 'bg-forest-100 border border-forest-700 text-forest-900 font-medium'
                  : 'bg-white border border-slate-300 text-forest-900 hover:border-slate-400'
              }`}
            >
              {isSelected ? '✓ ' : '+ '}
              {opt.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onAnswer(selected)}
        disabled={selected.length === 0}
        className="self-start px-4 py-2 bg-forest-900 text-forest-50 text-[13px] font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forest-700 transition"
      >
        Valider ({selected.length})
      </button>
    </div>
  );
}

function CardSelectInput({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: 'card_select' }>;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className={`grid gap-1.5 grid-cols-${Math.min(question.options.length, 4)}`}>
      {question.options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onAnswer(opt.id)}
          className="px-2 py-3.5 bg-white border border-slate-300 rounded-lg text-center hover:border-forest-500 hover:bg-forest-50 transition group"
        >
          <p className="text-[13px] font-medium text-forest-900 group-hover:text-forest-900">
            {opt.label}
          </p>
          {opt.description && (
            <p className="text-[10px] text-slate-500 mt-0.5 group-hover:text-forest-700">
              {opt.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

function NavigationFooter({
  canGoBack,
  onBack,
  onNext,
}: {
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-5 pt-4 border-t border-slate-200/60 flex gap-2.5">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="px-4 py-2.5 bg-transparent border border-slate-300 rounded-lg text-[13px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Retour
      </button>
      <button
        onClick={onNext}
        className="flex-1 px-4 py-2.5 bg-forest-900 text-forest-50 text-[13px] font-medium rounded-lg hover:bg-forest-700 transition flex items-center justify-center gap-1.5"
      >
        Suivant
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}
