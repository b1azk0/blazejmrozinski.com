---
term: "Restic"
seoTitle: "What Is Restic? Encrypted, Deduplicated Backups for Linux Servers"
description: "Restic is an open-source backup tool that produces encrypted, deduplicated, incremental backups to local storage or cloud providers. Learn how its content-addressed design works and how it fits into a server backup strategy."
definition: "Restic is an open-source backup tool that creates encrypted, deduplicated, incremental backups using a content-addressed snapshot model, with support for local storage, S3-compatible object storage, and most major cloud providers."
domain: "infrastructure"
relatedContent:
  - "blog/wp-infra-06-automating-the-boring-parts"
  - "blog/wp-infra-07-watching-over-it-all"
relatedTerms:
  - "vps"
  - "lemp-stack"
  - "cron"
  - "cache-warming"
  - "fail2ban"
status: published
date: 2026-04-27
---

A backup that exists is a different thing from a backup you can actually restore. Most ad-hoc backup arrangements — the periodic `tar` and `rsync` scripts, the daily archive uploaded somewhere — fail in one of two ways. They consume too much storage because they are not deduplicated, or they store data in a format the operator does not regularly verify, which means the first time anyone tries to restore is during an incident, and the restore does not work. Restic is the open-source backup tool I have settled on for full-server snapshots specifically because it removes both failure modes by design.

Restic is written in Go, distributes as a single static binary, runs on every major operating system, and produces backups in a content-addressed, encrypted, deduplicated format that supports incremental snapshots without re-uploading unchanged data. The design is conservative — there is no magic — and the failure modes that exist are documented and recoverable. For a small infrastructure of two to ten servers, it is the closest thing to a no-regrets default.

## The Content-Addressed Design

The core abstraction is the snapshot. A snapshot is a complete, point-in-time view of a directory tree. Internally, the data is broken into variable-sized chunks via content-defined chunking; each chunk is identified by its SHA-256 hash, and the repository stores each chunk exactly once.

The result is that two snapshots taken five minutes apart, with one modified file between them, share almost all their underlying chunks. Only the chunks containing the modified content are new in the second snapshot. The incremental cost on the wire and on disk is proportional to actual change, not to total data size.

This generalizes well. Snapshots from different machines that contain the same files (system binaries, package data, common configuration) deduplicate against each other. A repository accumulating snapshots of ten similar Linux servers does not store ten copies of `/usr/bin`; it stores one copy of each chunk that any server has ever held, plus the metadata trees that point into those chunks.

The design also makes integrity checking tractable. Every chunk is content-addressed, so verifying the repository is a matter of recomputing hashes and comparing them to the stored hash names. `restic check --read-data` does this end-to-end, which is the operation that distinguishes "I have a backup" from "I have a backup that is actually intact."

## Encryption

All data in a restic repository is encrypted with AES-256 in counter mode, with HMAC-SHA-256 for authentication. The encryption key is derived from a user-supplied password via scrypt. The repository itself contains no plaintext metadata; even file names and directory structures are encrypted.

This matters when the backup target is cloud storage. A restic repository in an S3 bucket or a Backblaze B2 account leaks no usable information about its contents to the storage provider beyond approximate size and access patterns. If the cloud account is compromised but the password is not, the attacker cannot read backup contents.

The key management has the property that you must keep the password somewhere recoverable. Losing the password means losing the repository entirely — there is no provider-side recovery mechanism by design, because that mechanism would be a ciphertext-recoverable backdoor. In production, the password lives in a file on the server (e.g., `/root/.restic-env`, mode 600) and in a separate secure location (a password manager, an offline copy) so that a fully destroyed server can be rebuilt from a clean machine using the recovered password.

## Repository Layout and Storage Backends

A restic repository is a directory of files with a fixed layout: configuration, encrypted keys, snapshot metadata, and packs of encrypted chunks. The format is documented and stable across versions.

The same repository format works against any of restic's supported backends:

- Local filesystems (including network-mounted shares).
- SFTP to a remote host.
- S3-compatible object storage (AWS S3, Backblaze B2, Wasabi, MinIO, and similar).
- Major cloud providers via their native APIs (Google Cloud Storage, Azure Blob Storage).
- Restic's own `rest-server` for repository hosting on dedicated backup servers.

Switching backends is a matter of changing the repository URL. The data does not change format. This is useful for migrations and for setting up second-tier backups where a repository on cheap object storage is mirrored to a different provider for disaster scenarios.

## Snapshot Operations

The basic operations have a small command set:

```bash
# Create a snapshot
restic backup /etc /var/www /root --tag nightly

# List snapshots
restic snapshots

# Restore a snapshot to a target directory
restic restore latest --target /tmp/recovered

# Mount a snapshot as a FUSE filesystem (for selective restore)
restic mount /tmp/restic

# Verify repository integrity
restic check
restic check --read-data  # Slower; reads and verifies every chunk

# Apply retention policy and reclaim space
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

The retention policy is one of restic's better-designed parts. `forget` operates on snapshot metadata; `--prune` is the separate step that actually reclaims storage by removing chunks no longer referenced by any retained snapshot. Splitting the two operations lets you separate "decide what to keep" from "actually free the space," which matters when prune operations are slow on large repositories.

## How It Fits a Server Backup Strategy

Restic does one job well: filesystem-level snapshots with deduplication and encryption. It does not orchestrate database dumps. It does not coordinate cross-server consistency. It does not handle application-level concerns like flushing caches or putting services into backup mode.

The right pattern is to use restic as the underlying backup primitive and layer the operational logic on top with shell scripts and [cron](/glossary/cron/). For a typical WordPress server, the layered design looks like:

1. A pre-backup script that creates a MariaDB dump using `--single-transaction` for InnoDB consistency.
2. The restic backup of the entire filesystem (excluding `/proc`, `/sys`, `/dev`, `/run`, `/tmp`, `/var/cache`, and `/var/log/journal` to skip volatile or non-recoverable data).
3. A post-backup `restic forget --prune` step that applies the retention policy and reclaims storage.
4. A weekly `restic check` that verifies repository integrity end-to-end.

This pattern produces a single weekly snapshot that captures the full server state — Nginx configuration, PHP-FPM pools, SSL certificates, cron entries, firewall rules, all of it — alongside the application data. Restoration from such a snapshot rebuilds the server to a known-good state without manually reconstructing the configuration.

For application-level backups (per-site WordPress backups via All-in-One WP Migration, for example), the cleaner approach is to keep those separate from the restic snapshot. Application backups are smaller, faster to restore for a single-site issue, and live alongside the full server snapshot in the recovery toolkit. The restic snapshot is the nuclear option; the application backup is the routine option.

## Operational Considerations

**Initial backup is slow; subsequent backups are fast.** The first snapshot has to chunk and upload everything. Once the repository is populated, incremental backups upload only changed chunks, which on a typical server is a small fraction of total data.

**Repository operations are CPU-bound, not IO-bound.** Encryption and chunking consume CPU. On low-end VPS instances, scheduling backups during off-peak hours matters more than the network throughput would suggest.

**Bandwidth on restore is full data.** Deduplication helps storage and incremental backup, not restore. Restoring a 100GB snapshot downloads 100GB of data even if only a fraction of that data is unique within the repository. Plan recovery time accordingly.

**Pruning is expensive on large repositories.** `restic prune` rewrites the underlying packs to remove unreferenced chunks. On a multi-terabyte repository, this can take hours. The default pattern is to prune on a schedule (weekly or monthly) rather than after every backup.

**Versioning works, sort of.** Restic snapshots are immutable by design. There is no "version history of file X" view; what you have is "list of snapshots, each containing a copy of file X." Walking through snapshots to find the desired version is straightforward but not as polished as some commercial backup tools.

## When Restic Is the Right Choice

Restic earns its place when:

- You are running a small fleet of servers (one to a few dozen) and want a single backup tool across all of them.
- You want encrypted backups to cheap object storage as a primary or secondary tier.
- You want to verify backup integrity routinely rather than discover problems during recovery.
- You want a backup format that is documented, stable, and not tied to a single vendor.

It is the wrong choice when the use case is image-level backups (BorgBackup, dedicated VM-snapshot tools, or vendor-native solutions are closer matches), when the data is dominated by a database that is better backed up via native database tools (PostgreSQL pg_dump, MariaDB mysqldump or mariabackup), or when the operational team has no Linux command-line proficiency and a managed service is a better fit.

For my own [WordPress server fleet](/blog/wp-infra-06-automating-the-boring-parts), restic is the weekly full-server snapshot layer running underneath the per-site application backup layer. The layering is intentional — application backups for routine restores, restic snapshots for rebuilding a destroyed server from a clean machine — and both layers have been exercised in real recovery scenarios. That dual exercise is the part that matters. A backup tool that has never been used for a real restore is a hypothesis. Restic earns the trust by being the format I have actually restored from when it counted.
