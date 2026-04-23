# Gmail add on

User still need to read their emails to know what to do for them. We should create a Gmail add-on which
only reads the email the user is currently on. This way we only have the gmail.addons.current.message.readonly
scope which is sensitive not restricted.

The subject should sent to our LLM to identify if it's a relevant email to parse. Once we identify it's
relevant then we should feed it to the processing agent. We should also show a popup to the user
that we've added the data to the job-hunt-ui.

This new feature is an alternative to the email sync feature.
