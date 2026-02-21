import { NextResponse } from 'next/server';

// This is a placeholder for a Cron Job API route.
// In production, this would be triggered daily by Vercel Cron or a similar service.

export async function GET(req: Request) {
    // Security check: Ensure the request comes from an authorized cron caller.
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    console.log('--- [CRON START] Checking Compliance Deadlines ---');

    // 1. Fetch all users who are on the "Pro" or "Business" tier from Supabase.
    // const { data: proUsers } = await supabase.from('users').select('*').in('membership_tier', ['Pro', 'Business']);
    const dummyProUsers = [
        { id: 'user_1', email: 'manager@example.com', name: 'John Doe', tier: 'Pro' }
    ];

    // Helper function to prevent rate limits
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    let notificationsSent = 0;

    // 2. Loop through each Pro user's properties.
    for (const user of dummyProUsers) {
        // const { data: properties } = await supabase.from('properties').select('*').eq('manager_id', user.id);
        const dummyProperties = [
            { id: 'prop_A', address: '123 Broadway, NY', ll97_deadline: '2025-05-01' },
            { id: 'prop_B', address: '456 5th Ave, NY', ll84_deadline: '2025-05-01' }
        ];

        for (const prop of dummyProperties) {
            // 3. For each property, check key deadlines (LL97, LL84, LL11, LL152, etc.).
            const today = new Date();

            // Example: Check LL97 Deadline
            if (prop.ll97_deadline) {
                const deadlineDate = new Date(prop.ll97_deadline);
                const diffTime = deadlineDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // 4. Send Email/SMS if deadline is exactly 30 days or 7 days away.
                if (diffDays === 30 || diffDays === 7) {
                    console.log(`[ALERT] Prop ${prop.address} - LL97 Report due in ${diffDays} days!`);

                    // Rate Limit Protection: Wait 1 second before sending email (e.g. for Resend limits)
                    await sleep(1000);

                    console.log(`Sending Email to ${user.email}...`);

                    // TODO: Integrate Resend (Email) or Twilio (SMS) here.
                    // await resend.emails.send({
                    //   from: 'alerts@nycshield.com',
                    //   to: user.email,
                    //   subject: `Urgent: LL97 Deadline Approaching for ${prop.address}`,
                    //   html: `<p>You have an upcoming filing due in ${diffDays} days.</p>`
                    // });

                    notificationsSent++;
                }
            }
        }
    }

    console.log(`--- [CRON END] Processed updates. Notifications sent: ${notificationsSent} ---`);

    return NextResponse.json({
        success: true,
        message: 'Cron job executed successfully',
        notificationsSent
    });
}
