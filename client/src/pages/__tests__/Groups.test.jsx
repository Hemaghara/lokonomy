import React from "react";
import { render, screen, fireEvent, waitFor } from "../../utils/test-utils";
import Groups from "../Groups";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { groupService } from "../../services/groupService";

// Mock the specific service import path
vi.mock("../../services/groupService", () => ({
  groupService: {
    getGroups: vi.fn(),
    getGroupDetails: vi.fn(),
    createGroup: vi.fn(),
    leaveGroup: vi.fn(),
    joinGroup: vi.fn(),
    createPost: vi.fn(),
    likePost: vi.fn(),
    addComment: vi.fn(),
  },
}));

const mockGroups = [
  {
    _id: "group-1",
    name: "Mapusa Bakers Union",
    description: "A local group for Mapusa bakers.",
    type: "business_association",
    taluka: "Mapusa",
    district: "North Goa",
    members: ["mock-user-id"],
  },
  {
    _id: "group-2",
    name: "Panaji Tech Hub",
    description: "Technology enthusiasts in Panaji.",
    type: "interest",
    taluka: "Panaji",
    district: "North Goa",
    members: [],
  },
];

const mockPosts = [
  {
    _id: "post-1",
    content: "Welcome to the group! Let's talk baking.",
    authorName: "John Doe",
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [
      {
        authorName: "Jane Smith",
        content: "Love this idea!",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

describe("Groups Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    groupService.getGroups.mockResolvedValue({
      data: { success: true, groups: mockGroups },
    });
    groupService.getGroupDetails.mockImplementation((id) => {
      const group = mockGroups.find((g) => g._id === id) || mockGroups[0];
      return Promise.resolve({
        data: { success: true, group, posts: id === "group-1" ? mockPosts : [] },
      });
    });
  });

  it("renders groups list and loads details of the first group automatically", async () => {
    render(<Groups />);

    expect(screen.getByText(/Loading groups.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading groups.../i)).not.toBeInTheDocument();
    });

    expect(screen.getAllByText("Mapusa Bakers Union")[0]).toBeInTheDocument();
    expect(screen.getByText("Panaji Tech Hub")).toBeInTheDocument();

    // Verify automatically selected first group
    expect(screen.getByRole("heading", { name: "Mapusa Bakers Union", level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the group!/i)).toBeInTheDocument();
    expect(screen.getByText("Love this idea!")).toBeInTheDocument();
  });

  it("filters groups by taluka when filter input is changed", async () => {
    render(<Groups />);

    await waitFor(() => {
      expect(screen.getAllByText("Mapusa Bakers Union").length).toBeGreaterThan(0);
    });

    const filterInput = screen.getByPlaceholderText(/Filter by Taluka/i);
    fireEvent.change(filterInput, { target: { value: "Panaji" } });

    // Since we mock API filter, the API should be called with taluka parameter
    expect(groupService.getGroups).toHaveBeenLastCalledWith(
      expect.objectContaining({ taluka: "Panaji" })
    );
  });

  it("joins and leaves group when Join/Leave button is clicked", async () => {
    groupService.joinGroup.mockResolvedValue({ data: { success: true } });
    groupService.leaveGroup.mockResolvedValue({ data: { success: true } });

    render(<Groups />);

    await waitFor(() => {
      expect(screen.getAllByText("Mapusa Bakers Union").length).toBeGreaterThan(0);
    });

    // User is member of group-1 ("Mapusa Bakers Union"), so button says "Leave Group"
    const leaveBtn = screen.getByRole("button", { name: /Leave Group/i });
    fireEvent.click(leaveBtn);

    expect(groupService.leaveGroup).toHaveBeenCalledWith("group-1");

    // Select second group (Panaji Tech Hub) where user is NOT a member
    const secondGroupBtn = screen.getByRole("button", { name: /Panaji Tech Hub/i });
    fireEvent.click(secondGroupBtn);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Panaji Tech Hub", level: 3 })).toBeInTheDocument();
    });

    const joinBtn = screen.getByRole("button", { name: /Join Group/i });
    fireEvent.click(joinBtn);

    expect(groupService.joinGroup).toHaveBeenCalledWith("group-2");
  });

  it("submits a new post for group members", async () => {
    groupService.createPost.mockResolvedValue({ data: { success: true } });
    
    render(<Groups />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to the group!/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Share an update/i);
    fireEvent.change(textarea, { target: { value: "Baking sourdough tomorrow!" } });

    const submitBtn = screen.getByRole("button", { name: /Post Update/i });
    fireEvent.click(submitBtn);

    expect(groupService.createPost).toHaveBeenCalledWith("group-1", "Baking sourdough tomorrow!");
  });

  it("likes a post in the group", async () => {
    groupService.likePost.mockResolvedValue({ data: { success: true } });

    render(<Groups />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to the group!/i)).toBeInTheDocument();
    });

    const likeBtn = screen.getByRole("button", { name: /0 Likes/i });
    fireEvent.click(likeBtn);

    expect(groupService.likePost).toHaveBeenCalledWith("post-1");
  });

  it("comments on a post", async () => {
    groupService.addComment.mockResolvedValue({ data: { success: true } });

    render(<Groups />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome to the group!/i)).toBeInTheDocument();
    });

    const commentInput = screen.getByPlaceholderText(/Write a comment/i);
    fireEvent.change(commentInput, { target: { value: "Looks delicious!" } });

    // Submit button next to input (using Send icon mock)
    const commentForm = commentInput.closest("form");
    fireEvent.submit(commentForm);

    expect(groupService.addComment).toHaveBeenCalledWith("post-1", "Looks delicious!");
  });

  it("opens create group modal and submits form successfully", async () => {
    groupService.createGroup.mockResolvedValue({ data: { success: true } });

    render(<Groups />);

    await waitFor(() => {
      expect(screen.getAllByText("Mapusa Bakers Union").length).toBeGreaterThan(0);
    });

    const openModalBtn = screen.getByTitle("Create Neighborhood Group");
    fireEvent.click(openModalBtn);

    // Form inputs
    const nameInput = screen.getByPlaceholderText(/e.g. Mapusa Bakers/i);
    const descInput = screen.getByPlaceholderText(/What is this group about/i);
    const typeSelect = screen.getByRole("combobox", { name: "" }); // dropdown for group type
    const talukaInput = screen.getByPlaceholderText(/e.g. Mapusa, Panaji/i);

    fireEvent.change(nameInput, { target: { value: "Goa Farmers Club" } });
    fireEvent.change(descInput, { target: { value: "Connecting local organic farmers." } });
    fireEvent.change(typeSelect, { target: { value: "interest" } });
    fireEvent.change(talukaInput, { target: { value: "Mapusa" } });

    const submitBtn = screen.getByRole("button", { name: /Create Group/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(groupService.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Goa Farmers Club",
          description: "Connecting local organic farmers.",
          type: "interest",
          taluka: "Mapusa",
        })
      );
    });
  });
});
