import { effect, signal } from "echojs-reactivity";

const $count = signal(0);

// peek(): не подписываем effect на изменения
const stop = effect(() => {
  console.log("peek:", $count.peek());
});

$count.set(1); // effect не перезапустится
stop();

// subscribe(): коллбек вызывается только при изменении значения
const unsub = $count.subscribe(() => {
  console.log("changed to", $count.peek());
});

$count.set(2); // вызовет subscribe
$count.set(2); // не вызовет subscribe
unsub();

