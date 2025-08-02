import { isMinimalIssue, MinimalIssue, MinimalIssueOrKeyAndSite } from '@atlassianlabs/jira-pi-common-models';

import { DetailedSiteInfo } from '../../atlclients/authInfo';
import { Container } from '../../container';
import { fetchMinimalIssue } from '../../jira/fetchIssue';
// import { FeatureFlagClient, Features } from '../../util/featureFlags';

interface VsCodeApi {
    postMessage<T = {}>(msg: T): void;
    setState(state: {}): void;
    getState(): {};
}
declare function acquireVsCodeApi(): VsCodeApi;

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

    console.log('sending message to vscode', chatMessage);

    const vscodeApi = acquireVsCodeApi();

    vscodeApi.postMessage({
        type: 'createWorktree',
        message: chatMessage.trim(),
    });

    const { startWorkV3WebviewFactory, startWorkWebviewFactory, shipitRovodevWebviewProvider } = Container;
    const asfd = await shipitRovodevWebviewProvider.resolveWebviewView();
    shipitRovodevWebviewProvider.postMessage({
        type: 'createWorktree',
        message: chatMessage.trim(),
    });

    // const factory = FeatureFlagClient.checkGate(Features.StartWorkV3)
    //     ? startWorkV3WebviewFactory
    //     : startWorkWebviewFactory;

    // factory.createOrShow({ issue });
}
