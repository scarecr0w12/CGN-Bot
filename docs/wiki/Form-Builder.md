# Form Builder

Create custom application forms for your Discord server! The Form Builder system lets you design multi-field forms for staff applications, event registrations, member screening, feedback collection, and more.

## Features

### Visual Form Designer
- Drag-and-drop field ordering
- Multiple field types (text, dropdown, multiple choice)
- Required/optional field settings
- Preview before publishing

### Automated Workflows
- Submission notifications to designated channels
- Review dashboard with approve/reject buttons
- Automatic role assignment on approval
- Webhook integration for external systems

### Response Management
- View all submissions in one place
- Filter by status (pending/approved/rejected)
- Add review notes
- Track reviewer and timestamps

### Tier Gating
- **Free Tier:** 2 forms, 50 responses/month
- **Tier 1 (Starter):** 5 forms, 200 responses/month
- **Tier 2 (Premium):** Unlimited forms and responses

## Getting Started

### Creating Your First Form

1. Navigate to **Dashboard → Form Builder**
2. Click **"Create New Form"**
3. Fill in basic information:
   - **Name:** Display name (e.g., "Staff Application")
   - **Description:** Brief explanation of the form's purpose

4. Add fields using the field editor:
   - Click **"Add Field"**
   - Enter field label
   - Select field type
   - Mark as required if needed
   - Add options for dropdown/multiple choice

5. Configure channels and settings:
   - **Submit Channel:** Where submissions are announced
   - **Review Channel:** Where staff can review applications
   - **Auto-Role:** Role assigned on approval
   - **Webhook URL:** External integration endpoint

6. Click **"Create Form"**

### Field Types

#### Short Text
Single-line text input for names, email addresses, or brief responses.

**Best for:**
- Names
- Email addresses
- Discord usernames
- Short answers

#### Long Text
Multi-line text area for detailed responses.

**Best for:**
- Experience descriptions
- Why you want to join
- Additional comments
- Detailed explanations

#### Dropdown (Select)
User selects one option from a list.

**Best for:**
- Age ranges
- Experience levels
- Preferred roles
- Yes/No questions

#### Multiple Choice
User selects multiple options from a list.

**Best for:**
- Available days/times
- Interests
- Skills
- Multiple preferences

## Form Management

### Editing Forms

1. Go to **Dashboard → Form Builder**
2. Click **"Edit"** on the form card
3. Modify fields, settings, or channels
4. Click **"Update Form"**

### Enabling/Disabling Forms

Toggle the switch on any form card to enable or disable without deleting it. Disabled forms cannot receive new submissions but retain all existing responses.

### Deleting Forms

Click the trash icon on a form card. **Warning:** This permanently deletes the form and all associated responses.

## Reviewing Responses

### Viewing Submissions

1. Navigate to **Dashboard → Form Builder**
2. Click **"Responses"** on the form card
3. View all submissions with:
   - User information
   - Submission timestamp
   - Response details
   - Current status

### Approving Applications

1. Review the submitted responses
2. Click **"Approve"** button
3. If auto-role is configured, role is assigned automatically
4. User receives DM notification of approval

### Rejecting Applications

1. Review the submitted responses
2. Click **"Reject"** button
3. (Optional) Enter rejection reason
4. User receives DM notification with notes

## Discord Integration

### Submission via Modals

Forms are submitted through Discord's native modal interface:

1. User runs form command (custom implementation needed)
2. Discord modal appears with all form fields
3. User fills out the form
4. Click "Submit"
5. Confirmation message sent

**Note:** Discord slash commands for form submission need to be implemented separately. Forms are currently managed through the dashboard.

### Notification Channels

#### Submit Channel
Public or semi-public channel where submissions are announced:

```
✅ Form Submitted: Staff Application
User123 submitted a form response
```

#### Review Channel
Staff-only channel with review buttons:

```
📋 Form Review Required: Staff Application
User123 submitted a response

[Approve] [Reject]
```

## Webhook Integration

Send form submissions to external services:

### Webhook Payload Format

```json
{
  "form_id": "form_123",
  "form_name": "Staff Application",
  "user_id": "218536118591684613",
  "user_tag": "User#1234",
  "responses": {
    "Name": "John Doe",
    "Experience": "3 years of moderation",
    "Available Days": "Monday, Wednesday, Friday"
  },
  "submitted_at": "2025-12-31T19:00:00.000Z"
}
```

### Supported Services

- **Discord Webhooks:** Post to other channels
- **Zapier:** Connect to 5000+ apps
- **Make (Integromat):** Advanced automation
- **Custom APIs:** Your own integration endpoints

### Setup Example

1. Create webhook in your service
2. Copy webhook URL
3. Paste into form's "Webhook URL" field
4. Test by submitting a form
5. Verify payload received

## Best Practices

### Form Design

**Keep it concise:**
- 5-10 fields maximum
- Only ask essential questions
- Use required fields sparingly

**Clear labels:**
- Be specific (not "Name" but "Discord Username")
- Add hints in descriptions
- Use consistent formatting

**Appropriate field types:**
- Dropdowns for fixed options
- Text areas for explanations
- Multiple choice for selecting several items

### Review Process

**Timely responses:**
- Review within 24-48 hours
- Set up notification roles
- Create review schedule

**Fair evaluation:**
- Use consistent criteria
- Document rejection reasons
- Offer reapplication opportunities

**Communication:**
- Send personalized rejection notes
- Welcome approved members
- Provide next steps

### Security

**Sensitive information:**
- Don't collect passwords or payment info
- Be mindful of privacy laws (GDPR, CCPA)
- Store only necessary data

**Permissions:**
- Restrict review channel access
- Limit form editing to admins
- Audit form changes

## Use Cases

### Staff Applications

**Fields:**
- Discord Username (short text, required)
- Age (dropdown, required)
- Previous Experience (long text, required)
- Available Hours (multiple choice, required)
- Why you want to help (long text, required)

**Settings:**
- Submit: #applications
- Review: #staff-review
- Auto-role: @Staff-Member

### Event Registration

**Fields:**
- In-Game Name (short text, required)
- Team Preference (dropdown)
- Availability (multiple choice, required)
- Special Requests (long text, optional)

**Settings:**
- Submit: #event-signups
- Review: #event-planning
- Auto-role: @Event-Participant

### Server Screening

**Fields:**
- How did you find us? (dropdown, required)
- Agree to rules (dropdown: Yes/No, required)
- Additional info (long text, optional)

**Settings:**
- Submit: None (private)
- Review: #verification-queue
- Auto-role: @Member (verified)

### Feedback Collection

**Fields:**
- Rating (dropdown: 1-5, required)
- What went well? (long text, required)
- What could improve? (long text, required)
- Additional comments (long text, optional)

**Settings:**
- Submit: None
- Review: #feedback-review
- Webhook: Send to feedback tracking tool

## Troubleshooting

### Form Not Appearing

**Check:**
- Form is enabled (green toggle)
- User has permission to view channels
- Bot is online and functional

### Responses Not Saving

**Check:**
- Database connection is active
- Monthly response limit not reached
- No errors in bot logs

### Review Buttons Not Working

**Check:**
- Bot has "Manage Roles" permission
- Review channel is configured correctly
- Reviewer has appropriate permissions

### Auto-Role Not Assigning

**Check:**
- Bot's role is above target role in hierarchy
- Bot has "Manage Roles" permission
- Role ID is correct in settings
- User is still in the server

## Limitations

### Discord Limitations
- Modal forms have max 5 components
- Text inputs limited to 4000 characters
- 15-minute timeout on modals

### Tier Limitations

**Free Tier:**
- 2 forms maximum
- 50 responses per month
- Basic features only

**Tier 1:**
- 5 forms maximum
- 200 responses per month
- Webhook integration

**Tier 2:**
- Unlimited forms
- Unlimited responses
- Priority support
- Advanced features

## API Reference

### Response Object

```javascript
{
  _id: "response_123",
  form_id: "form_456",
  server_id: "789",
  user_id: "218536118591684613",
  responses: {
    "Field Label": "User's answer"
  },
  status: "pending", // pending | approved | rejected
  reviewed_by: null,
  review_notes: null,
  submitted_at: Date,
  reviewed_at: null
}
```

### Form Object

```javascript
{
  _id: "form_123",
  server_id: "789",
  name: "Staff Application",
  description: "Join our team",
  fields: [
    {
      label: "Name",
      type: "short_text",
      required: true
    }
  ],
  submit_channel: "channel_id",
  review_channel: "channel_id",
  auto_role_id: "role_id",
  webhook_url: "https://...",
  enabled: true,
  created_at: Date,
  updated_at: Date
}
```

## Frequently Asked Questions

**Q: Can users edit their submissions after submitting?**
A: No, submissions are final. Consider adding a note instructing users to review before submitting.

**Q: Can I export form responses?**
A: Currently, responses must be viewed in the dashboard. Export functionality is planned for a future update.

**Q: How many fields can a form have?**
A: No hard limit in the database, but Discord modals support a maximum of 5 components. For longer forms, consider splitting into multiple modals.

**Q: Can I require authentication before form access?**
A: Forms require Discord authentication by default (user must be in the server).

**Q: Do form responses count toward my database storage?**
A: Yes, but form data is lightweight. Average response is <5KB.

**Q: Can I copy a form to another server?**
A: Not currently, but you can recreate forms manually using the same field configuration.

## Related Features

- [Dashboard Guide](Dashboard-Guide) - Learn about the dashboard
- [Premium Features](Premium-Features) - Upgrade for unlimited forms
- [Server Management](Server-Management) - Advanced server tools

---

Need help? Join our [support server](https://discord.gg/SE6xHmvKrZ) or check the dashboard tutorial.

*Last updated: December 31, 2025*
