// Feature flags for unreleased modules. Off until their version ships.
function flag(name: string): boolean {
  return process.env[name] === "true";
}

export const features = {
  pos: flag("FEATURE_POS"),
  channel: flag("FEATURE_CHANNEL"),
  booking: flag("FEATURE_BOOKING"),
};
