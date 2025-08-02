import { isMinimalIssue, MinimalIssue, MinimalIssueOrKeyAndSite } from '@atlassianlabs/jira-pi-common-models';

import { DetailedSiteInfo } from '../../atlclients/authInfo';
import { Container } from '../../container';
import { fetchMinimalIssue } from '../../jira/fetchIssue';

export async function startRovoDevWorkOnIssue(issueOrKeyAndSite: MinimalIssueOrKeyAndSite<DetailedSiteInfo>) {
    let issue: MinimalIssue<DetailedSiteInfo>;

    if (isMinimalIssue(issueOrKeyAndSite)) {
        issue = issueOrKeyAndSite;
    } else {
        issue = await fetchMinimalIssue(issueOrKeyAndSite.key, issueOrKeyAndSite.siteDetails);

        if (!issue) {
            throw new Error(`Jira issue ${issueOrKeyAndSite.key} not found in site ${issueOrKeyAndSite.siteDetails}`);
        }
    }

    const chatMessage = `
        You are working on the jira issue ${issue.key} (${issue.summary}). I will include the issue description at the bottom of this message.
        Please read the description, query any additional documentation that you may need, and get to work on the task.
        Generally, you will perform a coding task, and then push a branch to git remote.

        The jira issue is from jira located at ${issue.siteDetails.host}.

        Here is the issue description:
        """
        ${issue.descriptionHtml || issue.description || issue.summary}
        """
        `;

    console.log('Starting RovoDev work on issue:', issue.key);

    // Get the ShipIt webview provider from the container
    const { shipitRovodevWebviewProvider } = Container;

    // Create worktree and send message directly (doesn't require webview to be open)
    // This will:
    // 1. Create a new git worktree
    // 2. Start a RovoDev server for that worktree
    // 3. Send the chat message to the new RovoDev server
    await shipitRovodevWebviewProvider.createWorktreeWithMessage(chatMessage.trim());
}
