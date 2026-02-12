import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
  role?: "admin" | "user";
}

interface DeleteUserRequest {
  userId: string;
}

interface BatchCreateUsersRequest {
  users: CreateUserRequest[];
}

interface BatchDeleteUsersRequest {
  userIds: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isAdmin = callerRoles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "create": {
        const body: CreateUserRequest = await req.json();
        
        if (!body.email || !body.password) {
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: {
            full_name: body.fullName || body.email.split("@")[0],
            username: body.username || body.email.split("@")[0],
          },
        });

        if (createError) {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (newUser.user) {
          // If role is admin, update the user_roles table
          if (body.role === "admin") {
            await supabaseAdmin
              .from("user_roles")
              .update({ role: "admin" })
              .eq("user_id", newUser.user.id);
          }

          // Link student to the admin who created them (only for non-admin users)
          if (body.role !== "admin") {
            await supabaseAdmin
              .from("admin_students")
              .insert({ admin_id: caller.id, student_id: newUser.user.id });
          }
        }

        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const body: DeleteUserRequest = await req.json();
        
        if (!body.userId) {
          return new Response(
            JSON.stringify({ error: "User ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-deletion
        if (body.userId === caller.id) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify admin owns this student
        const { data: link } = await supabaseAdmin
          .from("admin_students")
          .select("id")
          .eq("admin_id", caller.id)
          .eq("student_id", body.userId)
          .single();

        if (!link) {
          return new Response(
            JSON.stringify({ error: "You can only delete students linked to your account" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Remove admin_students link
        await supabaseAdmin
          .from("admin_students")
          .delete()
          .eq("admin_id", caller.id)
          .eq("student_id", body.userId);

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(body.userId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "batch-create": {
        const body: BatchCreateUsersRequest = await req.json();
        
        if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
          return new Response(
            JSON.stringify({ error: "Users array is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const results: { email: string; success: boolean; error?: string }[] = [];

        for (const user of body.users) {
          if (!user.email || !user.password) {
            results.push({ email: user.email || "unknown", success: false, error: "Email and password required" });
            continue;
          }

          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
              full_name: user.fullName || user.email.split("@")[0],
              username: user.username || user.email.split("@")[0],
            },
          });

          if (createError) {
            results.push({ email: user.email, success: false, error: createError.message });
          } else {
            if (newUser.user) {
              if (user.role === "admin") {
                await supabaseAdmin
                  .from("user_roles")
                  .update({ role: "admin" })
                  .eq("user_id", newUser.user.id);
              } else {
                // Link student to the admin who created them
                await supabaseAdmin
                  .from("admin_students")
                  .insert({ admin_id: caller.id, student_id: newUser.user.id });
              }
            }
            results.push({ email: user.email, success: true });
          }
        }

        return new Response(
          JSON.stringify({ success: true, results }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "batch-delete": {
        const body: BatchDeleteUsersRequest = await req.json();
        
        if (!body.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
          return new Response(
            JSON.stringify({ error: "User IDs array is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Filter out caller's own ID
        const idsToDelete = body.userIds.filter((id) => id !== caller.id);
        const results: { userId: string; success: boolean; error?: string }[] = [];

        for (const userId of idsToDelete) {
          // Verify admin owns this student
          const { data: link } = await supabaseAdmin
            .from("admin_students")
            .select("id")
            .eq("admin_id", caller.id)
            .eq("student_id", userId)
            .single();

          if (!link) {
            results.push({ userId, success: false, error: "Not your student" });
            continue;
          }

          // Remove link
          await supabaseAdmin
            .from("admin_students")
            .delete()
            .eq("admin_id", caller.id)
            .eq("student_id", userId);

          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

          if (deleteError) {
            results.push({ userId, success: false, error: deleteError.message });
          } else {
            results.push({ userId, success: true });
          }
        }

        // Add skipped self-deletion if applicable
        if (body.userIds.includes(caller.id)) {
          results.push({ userId: caller.id, success: false, error: "Cannot delete your own account" });
        }

        return new Response(
          JSON.stringify({ success: true, results }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: create, delete, batch-create, batch-delete" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in manage-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
