# Introduction
Go-doudou（doudou pronounce /dəudəu/）is a gossip protocol based decentralized microservice
framework. It supports monolith service application as well. Currently, it supports RESTful service only.

### Why?
#### Background
- I'm lazy, and I believe there are many developers like me. 
- I'm not only an individual developer, but also a team leader with duty to make the whole team more productive
- I am from a small company, we can't afford to recruit many senior developers, so my team members have different dev levels
- I am from a small company, we don't have operation engineers  

#### Reason
- I need a tool to generate as much code as possible for us: if we don't know anything about tcp/ip/http/RESTFul/grpc/protobuf such low level things, and service register/service discover/failure detection/load balancing such microservice things, ONLY we know is CRUD, we still can develop robust programs/services out before the deadline. But I can't find such tool or framework.
- I am a developer not an operation engineer, I don't like setting up many infrastructures myself. I mean I don't want to set up etcd or zookeeper cluster and maintain them myself. I find memberlist, a gossip library developed by hashicorp who also developed consul, so I decide to make a microservice framework using it to let every service discover each other by themselves.
- I am a frontend developer in my early career, I know what a frontend developer want. So I choose OpenAPI 3.0 as bridge between frontend and backend. And I want to provide my frontend team members not only online documentation, but also mock server which can generating fake responses.  

#### Result
Go-doudou comes out, it's mainly inspired by 
- https://github.com/kujtimiihoxha/kit: a code generator cli for go-kit 
- https://github.com/hashicorp/memberlist: golang package for gossip based membership and failure detection
- https://spec.openapis.org/oas/v3.0.3: OpenAPI 3.0  

### Design Philosophy
- Design First: We encourage designing your apis at the first place.
- Contract: We use OpenAPI 3.0 spec as a contract between server and client to reduce the communication cost between
  different dev teams and speed up development.
- Decentralization: We use gossip protocol based service register and discovery mechanism to build a robust, scalable and
  decentralized service cluster.

### Features
- Low-code: design service interface to generate main function, routes, http handlers, mock service implementation, http
  client, OpenAPI 3.0 json spec and more.
- Support DNS address for service register and discovery
- Support both monolith and microservice architecture
- Built-in service governance support including client-side load balancer, rate limiter, circuit breaker, bulkhead, timeout, retry and more.
- Built-in graceful shutdown
- Built-in live reloading by watching go files(not support windows)
- Built-in service documentation UI
- Built-in service registry UI
- Built-in common used middlewares including tracing, logging, recover, request id, prometheus and more.
- Built-in docker and k8s deployment support: dockerfile, deployment kind yaml file and statefulset kind yaml file
- Easy to learn, simple to use