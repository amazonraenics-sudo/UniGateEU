export function welcomeEmail(name: string) {
  return {
    subject: 'Welcome to UniGateEU!',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1E3A5F;">Welcome to UniGateEU, ${name}!</h1>
        <p>Your AI-powered European university admissions journey starts now.</p>
        <p>You've received <strong>10 free credits</strong> to get started.</p>
        <p>Use them to:</p>
        <ul>
          <li>Find matching universities</li>
          <li>Generate your Statement of Purpose</li>
          <li>Analyze your documents</li>
          <li>And much more!</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Go to Dashboard
        </a>
      </div>
    `,
  }
}

export function creditPurchaseEmail(name: string, credits: number, amount: number) {
  return {
    subject: `${credits} Credits Added to Your Account`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1E3A5F;">Credits Added!</h1>
        <p>Hi ${name},</p>
        <p>Your purchase of <strong>${credits} credits</strong> for $${amount} was successful.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Start Using Credits
        </a>
      </div>
    `,
  }
}
