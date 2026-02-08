// core/audio.js

const correct = new Audio("../sounds/correct.wav");
const wrong = new Audio("../sounds/wrong.wav");
const click = new Audio("../sounds/click.wav");

correct.volume = wrong.volume = click.volume = 0.5;

export function playCorrect() {
  correct.currentTime = 0;
  correct.play();
}

export function playWrong() {
  wrong.currentTime = 0;
  wrong.play();
}
export function playClick() {
  click.currentTime = 0;
  click.play();
}

