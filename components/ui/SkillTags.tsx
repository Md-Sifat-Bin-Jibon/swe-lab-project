"use client";

import {
  useState,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

export interface SkillTagsProps {
  label?: string;
  inputId?: string;
  initialTags?: string[];
  value?: string[];
  onChange?: (tags: string[]) => void;
  className?: string;
}

export function SkillTags({
  label = "Add Skills You Offer",
  inputId = "skill-input",
  initialTags = ["UX/UI Design"],
  value,
  onChange,
  className = "",
}: SkillTagsProps) {
  const isControlled = value !== undefined;
  const [uncontrolledTags, setUncontrolledTags] = useState(initialTags);
  const [inputValue, setInputValue] = useState("");
  const tags = isControlled ? value : uncontrolledTags;

  function setTags(next: string[]) {
    if (!isControlled) {
      setUncontrolledTags(next);
    }
    onChange?.(next);
  }

  function addSkill() {
    const skill = inputValue.trim().replace(/^["']|["']$/g, "");
    if (!skill) {
      setInputValue("");
      return;
    }
    if (tags.some((tag) => tag.toLowerCase() === skill.toLowerCase())) {
      setInputValue("");
      return;
    }
    setTags([...tags, skill]);
    setInputValue("");
  }

  function removeSkill(skill: string) {
    setTags(tags.filter((tag) => tag !== skill));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-slate-800"
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        placeholder='(e.g., "Web Design", "Photography")'
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-swapspot-blue focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20"
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-2 rounded-lg bg-swapspot-blue/10 px-3 py-1.5 text-sm font-medium text-swapspot-blue"
          >
            {skill}
            <button
              type="button"
              className="text-swapspot-blue/70 transition hover:text-swapspot-blue"
              aria-label={`Remove ${skill}`}
              onClick={() => removeSkill(skill)}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
