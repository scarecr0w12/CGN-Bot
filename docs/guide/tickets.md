---
layout: default
title: Ticket System
parent: Guide
nav_order: 8
---

# Ticket System
{: .no_toc }

Create a professional support ticket system for your server with custom categories, ticket panels, and transcript logging.
{: .fs-6 .fw-300 }

**Requires:** Tier 2 Premium
{: .label .label-yellow }

## Table of Contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The ticket system allows server owners to set up an internal support system where users can create tickets for help, reports, or other inquiries. Staff members can manage, claim, and close tickets with full transcript logging.

### Features

- **Custom Categories** - Organize tickets by type (support, reports, applications, etc.)
- **Ticket Panels** - Create embed messages with buttons for easy ticket creation
- **Support Roles** - Configure which roles can view and manage tickets
- **Transcripts** - Automatic transcript logging when tickets are closed
- **Staff Management** - Claim tickets, add/remove users, set priority
- **Dashboard Integration** - Full ticket management from the web dashboard

---

## Commands

| Command | Description | Permission |
|:--------|:------------|:-----------|
| `ticket [category] [subject]` | Create a new ticket or view your tickets | Everyone |
| `ticketclose [reason]` | Close the current ticket | Ticket owner or staff |
| `ticketadd @user` | Add a user to the current ticket | Staff |
| `ticketremove @user` | Remove a user from the current ticket | Staff |
| `ticketpanel [title] \| [description]` | Create a ticket panel with buttons | Admin (Level 3+) |

---

## Setup Guide

### 1. Enable the Ticket System

1. Go to your server dashboard
2. Navigate to **Tickets** → **Ticket Settings**
3. Toggle **Enable Ticket System** on

### 2. Configure Channels

| Setting | Description |
|:--------|:------------|
| **Ticket Category** | Discord category where ticket channels will be created |
| **Transcript Channel** | Channel where ticket transcripts are saved when closed |
| **Log Channel** | Channel for ticket event notifications |

### 3. Set Support Roles

Select which roles can:
- View all tickets
- Claim and manage tickets
- Add/remove users from tickets

### 4. Create Categories

Add ticket categories to organize different types of support:

| Field | Description |
|:------|:------------|
| **Name** | Category name (e.g., "General Support") |
| **Emoji** | Emoji displayed on buttons |
| **Description** | Brief description of the category |
| **Welcome Message** | Custom message shown when ticket is created |

### 5. Create a Ticket Panel

Use the `ticketpanel` command to create an interactive panel:

```
!ticketpanel Support Center | Click a button below to create a support ticket!
```

This creates an embed with buttons for each category.

---

## Dashboard Management

### Ticket Settings Page

Access at: `Dashboard → Tickets → Ticket Settings`

Configure:
- Enable/disable the system
- Channel assignments
- Support roles
- Categories
- Welcome messages
- Max tickets per user

### Ticket List

Access at: `Dashboard → Tickets → View Tickets`

Filter tickets by:
- Status (Open, In Progress, On Hold, Closed)
- Priority
- Category

### Individual Ticket View

For each ticket you can:
- Change status and priority
- Add internal notes (staff-only)
- View message history
- See ticket metadata

---

## Ticket Lifecycle

```
┌─────────┐     ┌─────────────┐     ┌─────────┐     ┌────────┐
│  Open   │ ──► │ In Progress │ ──► │ On Hold │ ──► │ Closed │
└─────────┘     └─────────────┘     └─────────┘     └────────┘
     │                 │                  │              │
     │                 ▼                  ▼              │
     │          Staff Claims        Waiting on      Transcript
     │            Ticket              User           Saved
     └─────────────────────────────────────────────────┘
                    (Can reopen if needed)
```

### Status Definitions

| Status | Description |
|:-------|:------------|
| **Open** | New ticket, awaiting staff response |
| **In Progress** | Staff is actively working on the ticket |
| **On Hold** | Waiting for user response or action |
| **Closed** | Ticket resolved, transcript saved |

---

## Button Interactions

When users interact with ticket panels or ticket channels, they'll see buttons:

### Panel Buttons
- Category buttons to create tickets

### Ticket Channel Buttons
- **Close Ticket** - Close and save transcript
- **Claim Ticket** - Assign yourself as handler (staff only)

---

## Best Practices

1. **Clear Categories** - Create distinct categories to help route tickets efficiently
2. **Welcome Messages** - Set helpful welcome messages with common FAQ links
3. **Response Time** - Set expectations in your welcome message
4. **Transcript Channel** - Keep transcripts private (staff-only channel)
5. **Max Tickets** - Limit open tickets per user to prevent abuse (default: 3)

---

## Troubleshooting

### Ticket channels not creating

- Ensure the bot has `Manage Channels` permission
- Check that the ticket category has room (Discord limit: 50 channels)
- Verify the ticket system is enabled

### Users can't see their tickets

- Bot needs `Manage Roles` to set channel permissions
- Check Discord's role hierarchy

### Transcripts not saving

- Verify transcript channel is set
- Bot needs `Send Messages` and `Embed Links` in the channel

---

## API Reference

The ticket system exposes these database models:

- `ServerTickets` - Ticket documents
- `ServerTicketMessages` - Individual messages
- Server config: `serverDocument.tickets`

For extension developers, see the [Extension API](/api/extensions) for interacting with tickets.
