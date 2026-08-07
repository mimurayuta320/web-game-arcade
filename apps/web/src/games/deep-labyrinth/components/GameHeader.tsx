"use client";

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
};

export function GameHeader({ title, onTitleChange }: Props) {
  return (
    <header className="dlHeader" data-ui-panel="true">
      <div className="dlTitleWrap">
        <span className="dlTitleLabel">タイトル</span>
        <input
          className="dlTitleInput"
          value={title}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
          maxLength={36}
          aria-label="game title"
        />
      </div>
    </header>
  );
}
