** Todos-

1. Money Storage (The "Pots")

- [x] Account Management: You can track different bank accounts (Checking, Savings, Cash).

- [x] Liquidity Tracking: You have a "Total Liquidity" view that tells you exactly how much cash you have across all sources.

- [x] Balance Integrity: When you spend, the account balance updates; when you delete a transaction, the money is "refunded" to the account automatically via SQL triggers.

2. The Planning Layer (The "Envelopes")

- [x] Envelope Creation: You can create spending categories and group them (e.g., "Monthly Bills", "Daily Spending").

- [x] Ready to Assign (RTA): You have a central pool of money that hasn't been "given a job" yet.

- [x] Funding Envelopes: Through the Distribute Modal, you can move money from RTA into specific Envelopes.

- [x] Reassigning: You can "Sweep" money back from an envelope into RTA if you change your mind or over-budgeted.

3. The Activity Layer (The "Execution")

- [x] Transaction Logging: You can record spending, link it to a specific bank account, and categorize it into an envelope.

- [x] Automated Budget Impact: Spending money reduces the "Available" balance in the envelope and the bank account balance simultaneously.

- [x] Activity Feed: A searchable, date-grouped list of all your financial moves.

- [x] Correction Tools: You can swipe-to-delete mistakes, which triggers a full "reversal" of the financial impact.

4. Feedback & Monitoring

- [x] Dashboard Visuals: You can see which envelopes are healthy (Green) and which are overspent (Red).

- [x] Usage Tracking: Progress bars show how much of your monthly "plan" (Budgeted) you have already consumed.

- [x] Category Details: You can drill down into a specific envelope to see its dedicated history and adjust its funds.

5. What is Missing (The "Essential" Gap)

- [x] Income Handling: Currently, how does money get into RTA? We need a way to log a paycheck that specifically lands in "Ready to Assign" without being forced into a spending category.

- [x] Internal Transfers: Moving money between bank accounts (e.g., moving $1,000 from Checking to Savings) without it affecting your budget or being marked as "Spending."

- [ ] The "New Month" Rollover: What happens when the month ends? Does the left-over money stay in the envelope (standard ZBB) or reset?

- [ ] Edit Transactions: Currently, if you make a mistake in the amount (but not the whole transaction), you have to delete and re-add. An "Edit" flow is essential.