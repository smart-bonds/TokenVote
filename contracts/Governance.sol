// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Governance
 * @dev Contract for creating and managing governance proposals and votes
 */
contract Governance {
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address tokenAddress;
        address creator;
        uint256 startTime;
        uint256 endTime;
        uint256 quorum;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }
    
    struct Vote {
        bool voted;
        bool support;
        uint256 weight;
    }
    
    // Counter for proposal IDs
    uint256 public proposalCount;
    
    // Mapping of proposal ID to Proposal
    mapping(uint256 => Proposal) private proposals;
    
    // Mapping of proposal ID to voter address to Vote
    mapping(uint256 => mapping(address => Vote)) private votes;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        address indexed tokenAddress,
        address indexed creator,
        uint256 startTime,
        uint256 endTime,
        uint256 quorum
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool passed
    );
    
    /**
     * @dev Creates a new proposal
     * @param title The title of the proposal
     * @param description The description of the proposal
     * @param tokenAddress The address of the token to use for voting
     * @param duration The duration of the proposal in seconds
     * @param quorumPercent The percentage of total supply required for quorum (e.g., 10 for 10%)
     * @return The ID of the new proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        address tokenAddress,
        uint256 duration,
        uint256 quorumPercent
    ) public returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(quorumPercent > 0 && quorumPercent <= 100, "Quorum must be between 1 and 100");
        require(duration > 0, "Duration must be positive");
        
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(msg.sender) > 0, "Creator must hold some tokens");
        
        // Calculate quorum value (percentage of total supply)
        uint256 totalSupply = token.totalSupply();
        uint256 quorumValue = (totalSupply * quorumPercent) / 100;
        
        // Increment proposal counter
        proposalCount++;
        
        // Create new proposal
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: title,
            description: description,
            tokenAddress: tokenAddress,
            creator: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            quorum: quorumValue,
            votesFor: 0,
            votesAgainst: 0,
            executed: false
        });
        
        // Emit event
        emit ProposalCreated(
            proposalCount,
            title,
            tokenAddress,
            msg.sender,
            block.timestamp,
            block.timestamp + duration,
            quorumValue
        );
        
        return proposalCount;
    }
    
    /**
     * @dev Casts a vote on a proposal
     * @param proposalId The ID of the proposal to vote on
     * @param support Whether to support the proposal
     */
    function castVote(uint256 proposalId, bool support) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.executed, "Proposal already executed");
        require(!votes[proposalId][msg.sender].voted, "Already voted");
        
        // Get token balance of voter
        IERC20 token = IERC20(proposal.tokenAddress);
        uint256 weight = token.balanceOf(msg.sender);
        require(weight > 0, "Must have voting power");
        
        // Record vote
        votes[proposalId][msg.sender] = Vote({
            voted: true,
            support: support,
            weight: weight
        });
        
        // Update vote counts
        if (support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }
        
        // Emit event
        emit VoteCast(proposalId, msg.sender, support, weight);
    }
    
    /**
     * @dev Executes a proposal after the voting period ends
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "Proposal does not exist");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        
        // Check if quorum is reached
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVotes >= proposal.quorum, "Quorum not reached");
        
        // Mark proposal as executed
        proposal.executed = true;
        
        // Determine if proposal passed
        bool passed = proposal.votesFor > proposal.votesAgainst;
        
        // Emit event
        emit ProposalExecuted(proposalId, passed);
    }
    
    /**
     * @dev Checks if a voter has voted on a proposal
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     * @return Whether the voter has voted
     */
    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return votes[proposalId][voter].voted;
    }
    
    /**
     * @dev Gets the vote of a voter on a proposal
     * @param proposalId The ID of the proposal
     * @param voter The address of the voter
     * @return voted Whether the voter has voted
     * @return support Whether the voter supported the proposal
     * @return weight The voting weight of the voter
     */
    function getVote(uint256 proposalId, address voter) public view returns (
        bool voted,
        bool support,
        uint256 weight
    ) {
        Vote storage vote = votes[proposalId][voter];
        return (vote.voted, vote.support, vote.weight);
    }
    
    /**
     * @dev Gets a proposal
     * @param proposalId The ID of the proposal
     * @return The proposal
     */
    function getProposal(uint256 proposalId) public view returns (Proposal memory) {
        require(proposals[proposalId].id == proposalId, "Proposal does not exist");
        return proposals[proposalId];
    }
}
