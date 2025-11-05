import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MealModal } from "./MealModal";

export function AddMealButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="shadow-md hover:shadow-lg transition-shadow"
        data-testid="add-meal-button"
      >
        Dodaj posiłek
      </Button>
      <MealModal
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
