"""
ProcessorAgent:
    an agent that processes emails and updates the job hunt database
    it uses the ProcessorTools to interact with the database
    all agents read the email
    emails are not read in order so each stage needs to understand the state of the db.

    Agents:
        - orchestrator agent:
            * prompt: understands what the email is about and delegates to the appropriate processor agent
        processor agents:
        - application received agent:
            * use case: this agent should be called when the email is about a new application being received
            * prompt: The application date should be the date of the email
            * tools: ApplicationSummary, POST application, POST application_stage
            * process: Check for existing application (if not found create new application) then update stage
        - round passed agent:
            * use case: this agent should be called when the email is about a round being passed this often comes with
            an action item to schedule the next round
            * prompt: Update/create the prior round application stage and create an action item for the next round infer
            due date from the email
            * tools: ApplicationSummary,, POST application_stage, POST action_item
            * process: Check for existing application (if not found create new application) update stage
        - rejection agent:
            * use case: this agent should be called when the email is about a rejection being received
            * prompt: Update/create the application stage and mark as rejected
            * tools: ApplicationSummary, GET/PATCH/POST application_stage
            * process: Check for existing application (if not found create new application) update stage
        - next round agent:
            * use case: this agent should be called when the email schedules the next round we should
            * prompt: Update/create the next round application stage
            * tools: ApplicationSummary, POST application_stage, POST action_item
            * process: Check for existing application (if not found create new application)

"""
