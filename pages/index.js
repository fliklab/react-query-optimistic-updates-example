import React from "react";
import axios from "axios";

import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryClient,
  QueryClientProvider
} from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  );
}

function Example() {
  const queryClient = useQueryClient();
  const [text, setText] = React.useState("");
  const [cmtText, setCmtText] = React.useState("");
  const [userId, setUserId] = React.useState(1);

  const { status, data, error, isFetching } = useQuery("users", async () => {
    const res = await axios.get("/api/user");
    return res.data;
  });
  const usrCmtQuery = useQuery(["users",userId], async () => {
    const res = await axios.get(`/api/user/comment/${userId}`);
    return res.data;
  });

  const mutationFn = (text) => axios.post("/api/user", { text });
  const mutationByIdFn = (text) => axios.post(`/api/user/comment/${userId}`, { text });
  const addUserMutation = useMutation(mutationFn, {
    // Optimistically update the cache value on mutate, but store
    // the old value and return it so that it's accessible in case of
    // an error
    onMutate: async (text) => {
      setText("");
      await queryClient.cancelQueries("users");

      const previousValue = queryClient.getQueryData("users");

      queryClient.setQueryData("users", (old) => ({
        ...old,
        items: [...old.items, text]
      }));

      return previousValue;
    },
    // On failure, roll back to the previous value
    onError: (err, variables, previousValue) =>
      queryClient.setQueryData("users", previousValue),
    // After success or failure, refetch the users query
    onSettled: () => {
      queryClient.invalidateQueries("users");
    }
  });
  const addUserCommentMutation = useMutation(mutationByIdFn, {
    // Optimistically update the cache value on mutate, but store
    // the old value and return it so that it's accessible in case of
    // an error
    onMutate: async (text) => {
      setCmtText("");
      await queryClient.cancelQueries(["users", userId]);
      const previousValue = queryClient.getQueryData(["users", userId]);
      queryClient.setQueryData(["users",userId], (old) => ({
        ...old,
        comments: [...old.comments, text]
      }));

      return previousValue;
    },
    // On failure, roll back to the previous value
    onError: (err, variables, previousValue) =>
      queryClient.setQueryData(["users",userId], previousValue),
    // After success or failure, rfetch the users query
    onSettled: () => {
      queryClient.invalidateQueries(["users",userId]);
    }
  });

  return (
    <div>
      <p>
        Add Users
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addUserMutation.mutate(text);
        }}
      >
        <input
          type="text"
          onChange={(event) => setText(event.target.value)}
          value={text}
        />
        <button>{addUserMutation.isLoading ? "Creating..." : "Create"}</button>
      </form>
      {status === "loading" ? (
        "Loading..."
      ) : status === "error" ? (
        error.message
      ) : (
        <>
          <ul>
            {data && data.items?.map((datum) => (
              <li key={datum}>{datum}</li>
            ))}
          </ul>
          <div>{usrCmtQuery.isFetching ? "Updating in background..." : " "}</div>
        </>
      )}

      <br/><br/><br/><br/>
      <div>{userId}번 포스트 코멘트</div>
      <button onClick={() => setUserId(id => id - 1 > 0 ? id-1: id)}>before User</button>
      <button onClick={() => setUserId(id => id + 1 < 10 ? id+1:id)}>next User</button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addUserCommentMutation.mutate(cmtText);
        }}
      >
        <input
          type="text"
          onChange={(event) => setCmtText(event.target.value)}
          value={cmtText}
        />
        <button>{addUserCommentMutation.isLoading ? "Creating..." : "Create"}</button>
      </form>
      <br />
      
      {usrCmtQuery.status === "loading" ? (
        "Loading..."
      ) : usrCmtQuery.status === "error" ? (
        usrCmtQuery.error.message
      ) : (
        <>
          <ul>
            {usrCmtQuery.data && usrCmtQuery.data.comments?.map((datum) => (
              <li key={datum}>{datum}</li>
            ))}
          </ul>
          <div>{usrCmtQuery.isFetching ? "Updating in background..." : " "}</div>
        </>
      )}
      <ReactQueryDevtools initialIsOpen />
    </div>
  );
}
