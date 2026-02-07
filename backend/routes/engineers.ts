import {
  getAllEngineers,
  getEngineer,
  createEngineer,
} from "../db/queries";

export async function handleGetEngineers(
  corsOrigin: string,
): Promise<Response> {
  console.log("[engineers] GET all engineers");
  const engineersList = await getAllEngineers();
  console.log(`[engineers] Found ${engineersList.length} engineers`);
  return Response.json(
    { engineers: engineersList },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleGetEngineer(
  id: string,
  corsOrigin: string,
): Promise<Response> {
  console.log("[engineers] GET engineer:", id);
  const engineer = await getEngineer(id);
  if (!engineer) {
    console.warn("[engineers] Engineer not found:", id);
    return Response.json(
      { error: "Engineer not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }
  return Response.json(
    { engineer },
    { headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}

export async function handleCreateEngineer(
  req: Request,
  corsOrigin: string,
): Promise<Response> {
  const body = (await req.json()) as {
    name?: string;
    email?: string;
    avatarUrl?: string;
    discordId?: string;
    githubUsername?: string;
    skills?: string[];
  };
  const { name, email, avatarUrl, discordId, githubUsername, skills } = body;
  console.log("[engineers] POST create engineer:", { name, email, discordId, githubUsername });

  if (!name || !email) {
    console.warn("[engineers] Create failed: name and email required");
    return Response.json(
      { error: "name and email are required" },
      { status: 400, headers: { "Access-Control-Allow-Origin": corsOrigin } },
    );
  }

  const engineer = await createEngineer({
    name,
    email,
    avatarUrl,
    discordId,
    githubUsername,
    skills,
  });
  console.log("[engineers] Engineer created:", engineer.id);

  return Response.json(
    { engineer },
    { status: 201, headers: { "Access-Control-Allow-Origin": corsOrigin } },
  );
}
