# Database
This is a postgress db. 

## Local development
We run through dockercompose up

### How to access
This will start a psql session on your terminal to run abritrary queries:
`docker exec -it your-job-hunt-db-1 psql -U jobhunt -d jobhunt`

## Prod access

Details acessible in render dashboard.

docker run -it --rm \
  -e PGPASSWORD=<redacted> \
  postgres \
  psql -h <resource name> -U <user name> <db name>
