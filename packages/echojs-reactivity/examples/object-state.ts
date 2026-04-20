import { effect, signal } from "echojs-reactivity";

const $state = signal({
  user: { name: "Vova" },
  tags: ["a"],
});

effect(() => {
  console.log("name:", $state.value().user.name);
  console.log("tags:", $state.value().tags.join(","));
});

$state.update((prev) => ({
  ...prev,
  tags: [...prev.tags, "b"],
}));

