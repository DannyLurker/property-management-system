import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@pms/ui";

// Scaffold shell proving apps/pms-pos consumes @pms/ui.
// Real screens land with the v1.0.0 PMS features.
function App() {
  const [room, setRoom] = useState("");

  return (
    <div className="min-h-screen bg-brand-50 p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-brand-900">PMS scaffold</h1>
        <Card>
          <CardHeader>
            <CardTitle>Shared UI is wired</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Room number"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
            <Button type="button" onClick={() => setRoom("")}>
              Clear
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
