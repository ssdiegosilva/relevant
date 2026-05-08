-- Macro themes (roots) keep parent_id NULL.
-- Sub-topics get parent_id pointing at their macro theme.

update public.topics set parent_id = (select id from public.topics where slug = 'frontend')
where slug in ('javascript','typescript','react','design-systems','accessibility');

update public.topics set parent_id = (select id from public.topics where slug = 'backend')
where slug in ('node','python','go','rust','rest-api','graphql','grpc','rate-limiting','caching','queues','streaming','kafka');

update public.topics set parent_id = (select id from public.topics where slug = 'databases')
where slug in ('postgres','redis');

update public.topics set parent_id = (select id from public.topics where slug = 'devops')
where slug in ('docker','kubernetes','terraform','ci-cd','observability','aws','gcp','azure');

update public.topics set parent_id = (select id from public.topics where slug = 'ai-ml')
where slug in ('llm','rag','prompt-engineering','agents','vector-db');

update public.topics set parent_id = (select id from public.topics where slug = 'architecture')
where slug in ('microservices','event-driven');

update public.topics set parent_id = (select id from public.topics where slug = 'security')
where slug in ('auth','encryption');

update public.topics set parent_id = (select id from public.topics where slug = 'mobile')
where slug in ('react-native');
