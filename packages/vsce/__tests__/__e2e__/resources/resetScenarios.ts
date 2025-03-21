export function resetAllScenarios(): Promise<void> {
  const request: RequestInfo = new Request("http://localhost:8080/__admin/scenarios/reset", {
    method: "POST",
  });
  // Send the request and print the response
  return fetch(request).then((res) => {
    console.log("got response: ====", res.status);
  });
}
