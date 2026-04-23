"""
ProcessorTools:
    create a set of CRUD tools for each entity (application, stage, action item)
    these tools should be used by the processor agent to update the job hunt database

    we should have a special tool outside standard CRUD operations which is ApplicationSummary.
    This will get the application and all it's stages or return null if the application doesn't exist.
"""
