import { useState } from "react";
import { AddMealModal } from "./AddMealModal";

export function AddMealButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Dodaj posiłek</button>
      <AddMealModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(meal) => {
          console.log("Meal added:", meal);
          setIsOpen(false);
          // tutaj możesz odświeżyć listę posiłków
        }}
      />
    </>
  );
}
