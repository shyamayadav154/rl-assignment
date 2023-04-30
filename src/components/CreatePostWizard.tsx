import { useUser } from "@clerk/nextjs";
import {
  AtSymbolIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { api, type RouterOutputs } from "~/utils/api";
import Avatar from "./Avatar";
import Button from "./Button";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Modal from "./Modal";
dayjs.extend(relativeTime);

function convertImageFileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject("Error converting image file to data URL");
      }
    };
    reader.onerror = () => {
      reject("Error converting image file to data URL");
    };
    reader.readAsDataURL(file);
  });
}

type Tag = {
  username: string;
};

function CreatePostWizard() {
  const [image, setImage] = useState<File | undefined>(undefined);
  const [isTagModal, setIsTagModal] = useState(false);
  const [post, setPost] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const { mutate: createPostMutation, isLoading } =
    api.posts.create.useMutation({});
  const user = useUser();
  const userId = user.user?.id;
  const context = api.useContext();

  const [selectedUsers, setSelectedUsers] = useState<Tag[]>([]);

  const handleSelectTags = (user: User) => {
    if (!user.username) return;
    const username = user.username;
    if (typeof username !== "string") return;
    const isAlreadySelected = selectedUsers.some(
      (u) => u.username === username
    );
    if (isAlreadySelected) return;

    setSelectedUsers((prev) => [...prev, { username }]);
  };

  const createPost = async ({
    content,
    authorId,
    image,
    tags,
  }: {
    content: string;
    authorId: string;
    tags?: Tag[];
    image: File | undefined;
  }) => {
    if (!authorId) throw new Error("User not found");

    createPostMutation(
      {
        content,
        authorId,
        image: image && (await convertImageFileToDataURL(image)),
        tags,
      },
      {
        onSuccess: () => {
          void context.posts.getPostByFollowers.refetch();
          void context.posts.getPostsByUserId.refetch();
          setPost("");
          setImage(undefined);
          setSelectedUsers([]);
        },
      }
    );
  };

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    void createPost({
      content: post,
      authorId: userId,
      image,
      tags: selectedUsers,
    });
  };

  const handleImgChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target?.files[0];
    if (!file) return;
    const size = file?.size / 1024 / 1024;
    console.log(size);

    if (size > 4.05) {
      alert("Image size should be less than 4Mb");
      return;
    }

    setImage(file);
  };

  return (
    <>
      <div className="flex items-start space-x-4 border-b p-5">
        <div className="flex-shrink-0">
          <Avatar />
        </div>
        <div className="min-w-0 flex-1">
          <form onSubmit={onSubmitHandler} className="relative">
            <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
              <label htmlFor="comment" className="sr-only">
                write your post...
              </label>
              <textarea
                rows={3}
                name="post"
                value={post}
                onChange={(e) => setPost(e.target.value)}
                className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="write your post..."
              />

              {/* Spacer element to match the height of the toolbar */}
              <div className="py-2" aria-hidden="true">
                {/* Matches height of button in toolbar (1px border + 36px content height) */}
                <div className="py-px">
                  <div className="h-9" />
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
              <div className="flex items-center space-x-5">
                <div className="flex items-center">
                  <label
                    htmlFor="upload-photo"
                    className="-m-2.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
                  >
                    <PhotoIcon className="h-5 w-5" aria-hidden="true" />
                    <input
                      type="file"
                      name="image"
                      ref={uploadRef}
                      accept="image/*"
                      id="upload-photo"
                      multiple
                      onChange={handleImgChange}
                      className="invisible absolute inset-0 h-full w-full cursor-pointer rounded-md border-gray-300 opacity-0"
                    />
                    <span className="sr-only">Attach image</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => setIsTagModal(true)}
                    type="button"
                    className="-m-2.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500"
                  >
                    <AtSymbolIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Add tags</span>
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button>{isLoading ? "Posting..." : "Post"}</Button>
              </div>
            </div>
          </form>
          <ImageSelected image={image} />
          <TagSelected selectedUsers={selectedUsers} />
        </div>
      </div>
      <Modal open={isTagModal} setOpen={setIsTagModal}>
        {userId && (
          <TagModal
            closeModal={() => setIsTagModal(false)}
            selectedUsers={selectedUsers}
            handleSelectUser={handleSelectTags}
            userId={userId}
          />
        )}
      </Modal>
    </>
  );
}

const TagSelected = ({ selectedUsers }: { selectedUsers: Tag[] }) => {
  if (!selectedUsers.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center space-x-2">
      <h1>Tags:</h1>
      {selectedUsers.map((user) => (
        <div key={user.username} className="rounded-lg border px-3 py-1">
          {user.username}
        </div>
      ))}
    </div>
  );
};
type User = RouterOutputs["users"]["getAllUsers"][0];

type TagModalProps = {
  selectedUsers: Tag[];
  handleSelectUser: (user: User) => void;
  userId: string;
  closeModal: () => void;
};

function TagModal({
  userId,
  selectedUsers,
  handleSelectUser,
  closeModal,
}: TagModalProps) {
  const [search, setSearch] = useState("");
  const { data: users } = api.users.getAllUsers.useQuery({
    userId,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search) return [];

    return users.filter((user) => {
      if (!user?.username) return [];
      return user?.username.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, users]);

  console.log(filteredUsers, users, selectedUsers);

  return (
    <section className="h-[500px] w-[500px] rounded-lg bg-white p-2  ">
      <div className="flex items-center justify-between">
        <h1 className=" text-xl">Tag people</h1>
        <XMarkIcon onClick={closeModal} className="h-6 w-6 cursor-pointer" />
      </div>
      <article className="mt-2.5 flex items-center gap-2 ">
        <div className="relative w-full">
          <div className="flex gap-2">
            <MagnifyingGlassIcon
              className="mt-1 h-6 w-6 text-blue-600 "
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          {selectedUsers.map((user) => (
            <div key={user.username} className="mt-4">
              <span className="rounded border px-2 py-1">{user.username} </span>
            </div>
          ))}
          <div className="my-5 h-[1px] w-full bg-gray-300"></div>
          <ShowFilteredUserList
            handleSelectUser={handleSelectUser}
            clearSearch={() => setSearch("")}
            filteredUsers={filteredUsers}
          />
        </div>
      </article>
    </section>
  );
}

function ShowFilteredUserList({
  filteredUsers,
  handleSelectUser,
  clearSearch,
}: {
  filteredUsers: User[];
  handleSelectUser: (user: User) => void;
  clearSearch: () => void;
}) {
  if (!filteredUsers.length) return null;

  return (
    <article className="absolute inset-x-0 px-2">
      {filteredUsers.map((user) => (
        <div
          key={user.id}
          onClick={() => {
            handleSelectUser(user);
            clearSearch();
          }}
          className="flex items-center gap-2 rounded p-2 hover:bg-gray-50"
        >
          <div>
            <Avatar />
          </div>
          <div>
            <p>{user.username}</p>
          </div>
        </div>
      ))}
    </article>
  );
}

export default CreatePostWizard;

function ImageSelected({ image }: { image: File | undefined }) {
  if (!image) return null;

  return (
    <article className="mt-1">
      <div className="inline-block rounded border bg-gray-400 px-4 py-2">
        {image.name}
      </div>
    </article>
  );
}
