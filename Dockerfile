FROM denoland/deno:1.43.6

ARG PORT=8080
ENV PORT $PORT

# The port that your application listens to.
EXPOSE ${PORT}

WORKDIR /app

# Prefer not to run as root.
USER deno


# These steps will be re-run upon each file change in your working directory:
COPY --chown=deno . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD ["task", "start"]